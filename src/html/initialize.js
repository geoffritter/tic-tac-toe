import './tictactoe.js';

const initialize = () => {
    let game = document.querySelector('tic-tac-toe');
    let wrapper = document.querySelector('#wrapper');
    new ResizeObserver(() => {
      let size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
      game.style.width = size + 'px';
      game.style.height = size + 'px';
    })
    .observe(wrapper);
    window.removeEventListener('DOMContentLoaded', initialize);
};
window.addEventListener('DOMContentLoaded', initialize, { capture: false, once: true });