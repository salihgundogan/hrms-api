import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 50 }, // Testi hızlandırmak için süreleri kısalttım
        { duration: '20s', target: 100 },
        { duration: '5s', target: 0 },
    ],
};

export default function () {
    const loginRes = http.post(
        'http://app:5001/api/auth/login', // 'localhost' yerine 'app' kullanılıyor
        JSON.stringify({
            email: 'employee4@gmail.com',
            password: 'password123',
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    check(loginRes, {
        'login başarılı oldu (status 200)': (r) => r.status === 200,
        'login cevabı token içeriyor': (r) => r.json('token') !== undefined,
    });

    sleep(1);
}