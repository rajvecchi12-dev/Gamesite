(() => {
  const ui = new UI();
  let game = null;
  let selectedMode = '1v1';

  // ---- Menu ----
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMode = btn.dataset.mode;
      ui.populateTeamGrids();
      ui.showScreen('teamSelect');
    });
  });

  // ---- Team Select ----
  document.getElementById('team1-grid').addEventListener('click', e => {
    const opt = e.target.closest('.team-option');
    if (opt) ui.selectTeam(1, opt.dataset.teamId);
  });

  document.getElementById('team2-grid').addEventListener('click', e => {
    const opt = e.target.closest('.team-option');
    if (opt) ui.selectTeam(2, opt.dataset.teamId);
  });

  document.getElementById('btn-back-menu').addEventListener('click', () => {
    ui.showScreen('menu');
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    startGame();
  });

  // ---- Game Controls ----
  document.getElementById('btn-pause').addEventListener('click', () => {
    if (game) {
      game.pause();
      ui.showPause();
    }
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    if (game) {
      game.resume();
      ui.hidePause();
    }
  });

  document.getElementById('btn-quit').addEventListener('click', quitGame);
  document.getElementById('btn-quit-pause').addEventListener('click', () => {
    ui.hidePause();
    quitGame();
  });

  // ---- Game Over ----
  document.getElementById('btn-rematch').addEventListener('click', () => {
    startGame();
  });

  document.getElementById('btn-main-menu').addEventListener('click', () => {
    ui.showScreen('menu');
  });

  // ---- Game Logic ----
  function startGame() {
    const team1Data = ui.getSelectedTeam(1);
    const team2Data = ui.getSelectedTeam(2);
    const canvas = document.getElementById('game-canvas');

    ui.showScreen('game');
    ui.setTeamNames(team1Data, team2Data);
    ui.updateScore([0, 0]);
    ui.updateTimer(300);
    ui.updateTurn(1, team1Data);

    if (game) game.destroy();

    game = new Game(canvas, selectedMode, team1Data, team2Data);

    game.onGoal = (teamNum, score) => {
      const teamData = teamNum === 1 ? team1Data : team2Data;
      ui.updateScore(score);
      ui.showGoal(teamNum, teamData);
    };

    game.onTimeUpdate = (timeLeft) => {
      ui.updateTimer(timeLeft);
    };

    game.onTurnChange = (teamNum) => {
      const teamData = teamNum === 1 ? team1Data : team2Data;
      ui.updateTurn(teamNum, teamData);
    };

    game.onGameOver = (score) => {
      ui.showGameOver(score, team1Data, team2Data);
    };

    // Power bar update via animation frame hook
    const origDraw = game.draw.bind(game);
    game.draw = function () {
      origDraw();
      if (this.state === 'aiming') {
        ui.updatePower(this.power);
      } else {
        ui.updatePower(0);
      }
    };

    game.start();
  }

  function quitGame() {
    if (game) {
      game.destroy();
      game = null;
    }
    ui.showScreen('menu');
  }

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (game && game.state !== 'ended') {
        game.resize();
        game.initPhysics();
        game.setupPositions();
      }
    }, 200);
  });
})();
