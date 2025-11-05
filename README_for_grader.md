README - Vulnerability simulation full project

This project simulates multiple web vulnerabilities for educational purposes:
- SQL Injection (tautology)
- XSS (reflected, stored, DOM)
- CSRF (simulated token protection)
- Broken Authentication (weak login acceptance when enabled)
- Broken Access Control (admin resource accessible if flag disabled)
- XXE (simulated XML upload detection)
- Sensitive Data Exposure (simulated)

How to run:
1. npm install
2. npm start
3. Open http://localhost:3000

Notes:
- All simulations are safe and do not perform real attacks.
- Use the Flags panel to enable/disable each simulated vulnerability.
- For CSRF use token "securetoken123" as the valid token in legit flow.
- For auth demo, when auth_broken=true weak passwords like "1234" will be accepted.
