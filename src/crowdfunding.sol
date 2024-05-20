// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProjectFunding {
    address public owner;
    uint256 public constant MILESTONE_TIMEOUT = 30 days;
    uint256 public constant FUNDING_TIMEOUT = 15 days;
    enum ProjectStatus { Pending, Active, Funded, Completed, Cancelled }
    enum MilestoneStatus { Pending, Approved, Completed }

   struct Milestone {
    uint256 goal;
    uint256 deadline;
    MilestoneStatus status;
}

struct Project {
    address payable creator;
    uint256 deadline;
    uint256 milestoneDeadline;
    uint256 fundingGoal;
    uint256 amountRaised;
    ProjectStatus status; 
    Milestone[] milestones; 
    mapping(address => uint256) contributions; // 记录每个投资者的投资金额
    uint256 milestonePayouts; // 新增: 已发放的里程碑资金总额
    address[] contributors; // 记录所有的捐款者地址
}

    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    event ProjectCreated(uint256 projectId, uint256 fundingGoal, uint256 deadline);
    event ProjectApproved(uint256 projectId);
    event ProjectFunded(uint256 projectId, uint256 amount);
    event MilestoneApproved(uint256 projectId, uint256 milestoneId);
    event ProjectCancelled(uint256 projectId);
    event FundsWithdrawn(uint256 projectId, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    // 创建项目
  
function createProject(uint256 _fundingGoal, uint256[] memory _milestoneGoals, uint256[] memory _milestoneDeadlines, uint256 _Fundingtimeout) external {
    require(_milestoneGoals.length == _milestoneDeadlines.length, "Mismatched milestones data");

    uint256 totalMilestoneGoals = 0;
    for (uint i = 0; i < _milestoneGoals.length; i++) {
        totalMilestoneGoals += _milestoneGoals[i];
    }
    require(totalMilestoneGoals == _fundingGoal, "Total milestone goals must equal funding goal");

    uint256 newProjectId = ++projectCount;
    Project storage project = projects[newProjectId];
    project.creator = payable(msg.sender);
    project.fundingGoal = _fundingGoal;
    project.status = ProjectStatus.Pending;  

    for (uint i = 0; i < _milestoneGoals.length; i++) {
        project.milestones.push(Milestone({
            goal: _milestoneGoals[i],
            deadline: block.timestamp + _Fundingtimeout + _milestoneDeadlines[i],//新增：里程碑计时在——Fundingtimeout之后开始
            status: MilestoneStatus.Pending
        }));
    }

    emit ProjectCreated(newProjectId, _fundingGoal, block.timestamp + _Fundingtimeout);
}

//授权项目
function approveProject(uint256 _projectId) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Pending, "Project is not in pending status");

        project.status = ProjectStatus.Active;
        emit ProjectApproved(_projectId);
    }

    
// 投资项目
function fundProject(uint256 _projectId) external payable {
    Project storage project = projects[_projectId];
    require(project.status == ProjectStatus.Active, "Project is not active");
    require(project.amountRaised < project.fundingGoal, "Funding goal reached");

    if (project.contributions[msg.sender] == 0) {
        project.contributors.push(msg.sender); // 记录新的捐款者
    }

    project.amountRaised += msg.value;
    project.contributions[msg.sender] += msg.value; // 记录投资者的投资金额
    emit ProjectFunded(_projectId, msg.value);

    if (project.amountRaised >= project.fundingGoal) {
        project.status = ProjectStatus.Funded;
    }
}


    // 管理员审批里程碑

function approveMilestone(uint256 _projectId, uint256 _milestoneId) external onlyOwner {
    Project storage project = projects[_projectId];
    require(project.status == ProjectStatus.Funded, "Project funding not complete"); 

    Milestone storage milestone = project.milestones[_milestoneId];
    require(milestone.status == MilestoneStatus.Pending, "Milestone is not pending");
    require(block.timestamp <= milestone.deadline, "Milestone deadline has passed");

    milestone.status = MilestoneStatus.Approved; // 更新具体里程碑的状态
    project.milestonePayouts += milestone.goal; // 更新已发放的里程碑资金总额
    emit MilestoneApproved(_projectId, _milestoneId);
        
        // 检查所有里程碑是否都完成，若完成则更新项目状态
        bool allMilestonesCompleted = true;
        for (uint i = 0; i < project.milestones.length; i++) {
            if (project.milestones[i].status != MilestoneStatus.Approved) {
                allMilestonesCompleted = false;
                break;
            }
        }

        if (allMilestonesCompleted) {
            project.status = ProjectStatus.Completed;
        }
}
    
 // 撤销项目
function cancelProject(uint256 _projectId) external onlyOwner {
    Project storage project = projects[_projectId];
    require(project.status == ProjectStatus.Active || project.status == ProjectStatus.Funded, "Project is not active or already cancelled");

    project.status = ProjectStatus.Cancelled;
    uint256 totalContributions = project.amountRaised;
    uint256 remainingFunds = totalContributions - project.milestonePayouts;

    // 确保剩余资金大于零
    require(remainingFunds > 0, "No remaining funds to refund");

    // 退还每个捐款者的资金
    for (uint i = 0; i < project.contributors.length; i++) {
        address contributor = project.contributors[i];
        uint256 contribution = project.contributions[contributor];
        if (contribution > 0) {
            uint256 refundAmount = (contribution * remainingFunds) / totalContributions; // 按投资比例计算退款金额
            project.contributions[contributor] = 0; // 防止重入攻击
            payable(contributor).transfer(refundAmount); // 退还投资者的投资金额
        }
    }

    emit ProjectCancelled(_projectId);
}



  
  // 发放资金
function withdrawFunds(uint256 _projectId) external onlyOwner {
    Project storage project = projects[_projectId];
    require(project.status == ProjectStatus.Funded, "Project funding not complete or project still active");

    uint256 amountToWithdraw = 0;

    // 计算当前可以提取的金额，即所有已批准里程碑的金额
    for (uint i = 0; i < project.milestones.length; i++) {
        if (project.milestones[i].status == MilestoneStatus.Approved && project.milestones[i].goal > project.milestonePayouts) {
            amountToWithdraw += project.milestones[i].goal;
            project.milestonePayouts += project.milestones[i].goal; // 更新已发放的里程碑金额
        }
    }

    require(amountToWithdraw > 0, "No new funds to withdraw");

    project.creator.transfer(amountToWithdraw);

    // 检查是否所有里程碑都已批准
    bool allMilestonesApproved = true;
    for (uint i = 0; i < project.milestones.length; i++) {
        if (project.milestones[i].status != MilestoneStatus.Approved) {
            allMilestonesApproved = false;
            break;
        }
    }

    // 如果所有里程碑都已批准，将项目状态更新为完成
    if (allMilestonesApproved) {
        project.status = ProjectStatus.Completed;
    }

    emit FundsWithdrawn(_projectId, amountToWithdraw);
}




  // 超时处理（退款）
function timeoutRefund(uint256 _projectId) external {
    Project storage project = projects[_projectId];
    require(block.timestamp > project.deadline, "Project deadline not yet passed");
    require(project.status == ProjectStatus.Active || project.status == ProjectStatus.Funded, "Project not active or already processed");

    project.status = ProjectStatus.Cancelled;
    uint256 totalContributions = project.amountRaised;
    uint256 remainingFunds = totalContributions - project.milestonePayouts;

    // 确保剩余资金大于零
    require(remainingFunds > 0, "No remaining funds to refund");

    // 退还每个捐款者的资金
    for (uint i = 0; i < projectCount; i++) {
        uint256 contribution = project.contributions[msg.sender];
        if (contribution > 0) {
            uint256 refundAmount = (contribution * remainingFunds) / totalContributions; // 按投资比例计算退款金额
            project.contributions[msg.sender] = 0; // 防止重入攻击
            payable(msg.sender).transfer(refundAmount); // 退还投资者的投资金额
        }
    }
}

}
