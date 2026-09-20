const playButton = document.querySelector('#play-film');
const film = document.querySelector('#feature-film');
const steps = [...document.querySelectorAll('.film-step')];
let timer;

function setStep(index) {
  steps.forEach((step, position) => step.classList.toggle('active', position === index));
}

function playFilm() {
  clearInterval(timer);
  film.classList.remove('playing');
  void film.offsetWidth;
  film.classList.add('playing');
  playButton.setAttribute('aria-pressed', 'true');
  playButton.querySelector('.play-label').textContent = 'Replay video';
  let position = 0;
  setStep(position);
  timer = setInterval(() => {
    position += 1;
    if (position >= steps.length) {
      clearInterval(timer);
      playButton.setAttribute('aria-pressed', 'false');
      return;
    }
    setStep(position);
  }, 3000);
}

playButton.addEventListener('click', playFilm);
