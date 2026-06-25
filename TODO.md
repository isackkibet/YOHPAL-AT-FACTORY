# TODO - Start Everything (Simple)

- [x] Create `start-all.sh` to start: infra (docker compose), backend (PM2 ecosystem), Admin (Next.js), Flutter (web-server)
- [ ] (Optional) Update README with corrected PM2/admin/flutter commands
- [ ] After running `./start-all.sh`, verify:
  - [ ] `pm2 status` shows all 6 backend services running
  - [ ] Admin shows in browser (from Next.js dev output)
  - [ ] Flutter loads at http://localhost:5002
  - [ ] Gateway health endpoint works (may need to adjust URL)

