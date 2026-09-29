class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById('menu-screen'),
      teamSelect: document.getElementById('team-select-screen'),
      game: document.getElementById('game-screen'),
      gameover: document.getElementById('gameover-screen'),
    };

    this.elements = {
      score1: document.getElementById('score1'),
      score2: document.getElementById('score2'),
      timer: document.getElementById('timer'),
      turnIndicator: document.getElementById('turn-indicator'),
      team1Name: document.getElementById('team1-name'),
      team2Name: document.getElementById('team2-name'),
      goalOverlay: document.getElementById('goal-overlay'),
      goalTeam: document.getElementById('goal-team'),
      pauseOverlay: document.getElementById('pause-overlay'),
      powerBarContainer: document.getElementById('power-bar-container'),
      powerFill: document.getElementById('power-fill'),
      gameoverTitle: document.getElementById('gameover-title'),
      finalTeam1: document.getElementById('final-team1'),
      finalTeam2: document.getElementById('final-team2'),
      finalScore1: document.getElementById('final-score1'),
      finalScore2: document.getElementById('final-score2'),
      team1Grid: document.getElementById('team1-grid'),
      team2Grid: document.getElementById('team2-grid'),
    };
  }

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[name]) {
      this.screens[name].classList.add('active');
    }
  }

  populateTeamGrids() {
    this.elements.team1Grid.innerHTML = '';
    this.elements.team2Grid.innerHTML = '';

    for (const team of TEAMS) {
      const btn1 = this.createTeamOption(team);
      const btn2 = this.createTeamOption(team);
      this.elements.team1Grid.appendChild(btn1);
      this.elements.team2Grid.appendChild(btn2);
    }

    // Default selections
    this.selectTeam(1, 'brasil');
    this.selectTeam(2, 'argentina');
  }

  createTeamOption(team) {
    const btn = document.createElement('button');
    btn.className = 'team-option';
    btn.dataset.teamId = team.id;
    btn.innerHTML = `<span class="team-flag">${team.flag}</span>${team.name}`;
    return btn;
  }

  selectTeam(teamNum, teamId) {
    const gridId = teamNum === 1 ? 'team1Grid' : 'team2Grid';
    const grid = this.elements[gridId];
    grid.querySelectorAll('.team-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.teamId === teamId);
    });
  }

  getSelectedTeam(teamNum) {
    const gridId = teamNum === 1 ? 'team1Grid' : 'team2Grid';
    const grid = this.elements[gridId];
    const selected = grid.querySelector('.team-option.selected');
    if (!selected) return TEAMS[0];
    return TEAMS.find(t => t.id === selected.dataset.teamId) || TEAMS[0];
  }

  updateScore(score) {
    this.elements.score1.textContent = score[0];
    this.elements.score2.textContent = score[1];
  }

  updateTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.elements.timer.textContent =
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  updateTurn(teamNum, teamData) {
    this.elements.turnIndicator.textContent = `Vez: ${teamData.name}`;
    this.elements.turnIndicator.style.borderLeft =
      `3px solid ${teamNum === 1 ? '#ef4444' : '#3b82f6'}`;
  }

  setTeamNames(team1, team2) {
    this.elements.team1Name.textContent = team1.name;
    this.elements.team2Name.textContent = team2.name;
  }

  showGoal(teamNum, teamData) {
    this.elements.goalTeam.textContent = teamData.name;
    this.elements.goalOverlay.style.display = 'flex';
    setTimeout(() => {
      this.elements.goalOverlay.style.display = 'none';
    }, 1800);
  }

  showPause() {
    this.elements.pauseOverlay.style.display = 'flex';
  }

  hidePause() {
    this.elements.pauseOverlay.style.display = 'none';
  }

  updatePower(power) {
    if (power > 0) {
      this.elements.powerBarContainer.style.display = 'flex';
      this.elements.powerFill.style.width = `${power * 100}%`;
    } else {
      this.elements.powerBarContainer.style.display = 'none';
    }
  }

  showGameOver(score, team1Data, team2Data) {
    let title;
    if (score[0] > score[1]) {
      title = `${team1Data.name} Venceu!`;
    } else if (score[1] > score[0]) {
      title = `${team2Data.name} Venceu!`;
    } else {
      title = 'Empate!';
    }
    this.elements.gameoverTitle.textContent = title;
    this.elements.finalTeam1.textContent = team1Data.flag + ' ' + team1Data.name;
    this.elements.finalTeam2.textContent = team2Data.flag + ' ' + team2Data.name;
    this.elements.finalScore1.textContent = score[0];
    this.elements.finalScore2.textContent = score[1];
    this.showScreen('gameover');
  }
}
