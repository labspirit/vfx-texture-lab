# 다른 컴퓨터에서 계속 작업하기

## 가장 권장하는 흐름

1. 이 Git 저장소를 볼 수 있는 GitHub 계정으로 각 컴퓨터에서 인증한다. 다른 GitHub 계정이라면 소유자가 해당 계정에 저장소 접근 권한을 부여해야 한다. ChatGPT 계정과 GitHub 계정은 별개다.
2. 최초 한 번: `git clone https://github.com/labspirit/vfx-texture-lab.git`.
3. 내려받은 폴더를 Codex의 로컬 프로젝트로 연다. 새 AI/계정에서는 AGENTS.md와 HANDOFF.md를 읽고 이어가도록 요청한다.
4. 다른 컴퓨터의 작업을 받기 전에는 현재 변경을 저장한 후 `git pull --ff-only`를 실행한다. 분기 충돌이 나면 강제 덮어쓰기하지 말고 이력을 확인한다.
5. 개발 작업 완료 시 `node scripts/checkpoint.mjs --sync`를 실행한다. 실행만 할 때는 Node 없이 Ember.html을 Chrome/Edge로 열면 된다. 개발·검증 스크립트에는 Node.js와 Git이 필요하다.

## 로컬 저장 명령

- `node scripts/checkpoint.mjs`: 빌드·검증 후 로컬 Git에 커밋하고 ZIP을 생성한다.
- `node scripts/checkpoint.mjs --sync`: 위 작업 후 origin에 push한다. 실패하더라도 로컬 기록은 남는다.
- 설명 남기기: `node scripts/checkpoint.mjs --note "수정 내용" --sync`.
- Windows에서는 Save-Local.cmd 또는 Save-and-Sync.cmd를 더블클릭할 수도 있다.

Git 이름/이메일이 설정되지 않은 컴퓨터에서는 해당 커밋에만 `Local checkpoint <local-checkpoint@localhost>`를 사용한다. 전역 Git 설정은 바꾸지 않는다. 본인 이름으로 기록하려면 저장소에서 `git config user.name "이름"`, `git config user.email "이메일"`을 실행한다.

ZIP은 프로젝트 내부 `_backups/`에 쌓인다. 파일명에 저장 시간과 커밋 번호가 들어가며, 같은 커밋을 반복 저장하면 같은 ZIP을 재사용한다. 최신 추적 파일의 스냅샷으로 .qa와 문서도 포함하지만 .git 전체 이력·기존 backup-* 폴더·비밀 설정은 포함하지 않는다. 전체 Git 이력은 원격 저장소에 보관한다. 기존 로컬 backup-* 폴더는 그대로 유지한다.

ZIP으로 이동하는 경우 압축을 풀고 Ember.html을 실행하거나 새 로컬 프로젝트로 연다. 개발을 계속할 때 Git 이력도 필요하면 ZIP 대신 저장소를 clone한다.

## 텍스처 작업 파일도 함께 보관

브라우저 자동 저장·즐겨찾기·UI 설정은 다른 컴퓨터로 자동 이동하지 않는다. 프로그램에서 **프리셋 저장**을 눌러 실제 작업 JSON을 내려받고 `presets/`에 넣어 체크포인트를 저장한다. 결과 PNG/GIF는 `exports/`에 넣을 수 있다. 소스·프리셋·출력 파일은 이 폴더 안에 있어야 함께 저장된다.

채팅 기록 자체를 다른 계정으로 이전하는 기능은 이 설정에 포함되지 않는다. 새 채팅은 인수인계 문서를 바탕으로 작업을 이어간다. 이 설정은 백그라운드 실시간 동기화가 아니라 작업 완료 시 실행하는 검증된 체크포인트다.
