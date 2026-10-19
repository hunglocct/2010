// app.js - Controller coordinating 3D Blue Tulip Garden Diorama & 20/10 Letter for Bạn Ánh
import { TulipGardenScene } from './tulip-garden.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Tulip Garden Scene
  const gardenScene = new TulipGardenScene('world');

  // Letter Modal Elements
  const openLetterBtn = document.getElementById('openLetterBtn');
  const letterModal = document.getElementById('letterModal');
  const closeLetterBtn = document.getElementById('closeLetterBtn');

  // Letter Modal Interactions
  const openLetter = () => {
    if (!letterModal) return;
    letterModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLetter = () => {
    if (!letterModal) return;
    letterModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (openLetterBtn) {
    openLetterBtn.addEventListener('click', openLetter);
  }

  if (closeLetterBtn) {
    closeLetterBtn.addEventListener('click', closeLetter);
  }

  // Close letter when clicking backdrop outside card
  if (letterModal) {
    letterModal.addEventListener('click', (e) => {
      if (e.target === letterModal) {
        closeLetter();
      }
    });
  }

  // Close with Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && letterModal && letterModal.classList.contains('active')) {
      closeLetter();
    }
  });
});
