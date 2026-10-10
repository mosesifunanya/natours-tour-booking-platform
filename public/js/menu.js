/* eslint-disable */

const burger = document.querySelector('.m-burger');
const drawer = document.querySelector('.m-drawer');
const closeBtn = document.querySelector('.m-close');

if (burger && drawer && closeBtn) {
  burger.addEventListener('click', () => {
    drawer.classList.add('m-drawer--open');
  });

  closeBtn.addEventListener('click', () => {
    drawer.classList.remove('m-drawer--open');
  });
}
