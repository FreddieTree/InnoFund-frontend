import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 200 },  // 1分钟内达到200个虚拟用户
    { duration: '1m', target: 400 },  // 1分钟内达到400个虚拟用户
    { duration: '1m', target: 600 },  // 1分钟内达到600个虚拟用户
    { duration: '1m', target: 800 },  // 1分钟内达到800个虚拟用户
    { duration: '1m', target: 1000 }, // 1分钟内达到1000个虚拟用户
    { duration: '1m', target: 0 },    // 逐步降到0个虚拟用户
  ],
};

export default function () {
  let res = http.get('https://test.k6.io');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
