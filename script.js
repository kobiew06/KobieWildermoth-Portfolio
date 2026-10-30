const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');

function closeNavigation() {
  navbar.classList.remove('active');
  menuIcon.classList.remove('bx-x');
  menuIcon.setAttribute('aria-expanded', 'false');
  menuIcon.setAttribute('aria-label', 'Open navigation');
}
menuIcon.addEventListener('click', () => {
  const open = navbar.classList.toggle('active');
  menuIcon.classList.toggle('bx-x', open);
  menuIcon.setAttribute('aria-expanded', String(open));
  menuIcon.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navbar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNavigation(); });

const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(contactForm);
  const subject = fields.get('subject') || 'Contact Kobie';
  const body = `Hi Kobie,\n\n${fields.get('message')}\n\nFrom: ${fields.get('name')}\nEmail: ${fields.get('email')}`;
  window.location.href = `mailto:kobiew06@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Reveal content once, without hiding it when reduced motion is requested.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('reveal-pending');
      entry.target.classList.add('reveal-ready');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.about-content, .experience-box, .project-explorer').forEach(element => {
    revealObserver.observe(element);
    element.classList.add('reveal-pending');
  });
}

// Keep the navigation in step with the section being read.
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navbar.querySelectorAll('a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('body > section[id]').forEach(section => sectionObserver.observe(section));
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.getElementById('motion-toggle');
let manuallyPaused = false;
function updateMotion() {
  const paused = manuallyPaused || motionPreference.matches;
  document.body.classList.toggle('motion-paused', paused);
  motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.disabled = motionPreference.matches;
  motionButton.title = motionPreference.matches ? 'Motion is disabled by your device settings' : '';
  if (paused) {
    document.querySelector('.home-portrait').style.removeProperty('--portrait-x');
    document.querySelector('.home-portrait').style.removeProperty('--portrait-y');
    document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
  }
}
motionButton.hidden = false;
motionButton.addEventListener('click', () => { manuallyPaused = !manuallyPaused; updateMotion(); });
motionPreference.addEventListener('change', updateMotion);
updateMotion();

const projectTabs = [...document.querySelectorAll('.project-tabs button')];
const projectPanels = [...document.querySelectorAll('.project-panel')];
function selectProject(tab) {
  projectTabs.forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-expanded', String(active));
    button.querySelector('span').textContent = active ? '−' : '+';
  });
  projectPanels.forEach(panel => {
    const active = panel.id === tab?.getAttribute('aria-controls');
    if (!active) panel.querySelectorAll('video').forEach(video => video.pause());
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  document.querySelector('.project-workspace').hidden = !tab;
  document.querySelector('.project-explorer').classList.toggle('is-collapsed', !tab);
}
projectTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProject(tab.getAttribute('aria-expanded') === 'true' ? null : tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % projectTabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + projectTabs.length - 1) % projectTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = projectTabs.length - 1;
    if (event.key === 'Escape') selectProject(null);
    if (next === undefined) return;
    event.preventDefault();
    projectTabs[next].focus();
  });
});
selectProject(null);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('in-view', entry.isIntersecting);
  }, { threshold: 0.05 }).observe(document.getElementById('projects'));
} else document.getElementById('projects').classList.add('in-view');

const portrait = document.querySelector('.home-portrait');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let portraitFrame;
portrait.addEventListener('pointermove', event => {
  if (!finePointer.matches || manuallyPaused || motionPreference.matches) return;
  const rect = portrait.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
  cancelAnimationFrame(portraitFrame);
  portraitFrame = requestAnimationFrame(() => {
    portrait.style.setProperty('--portrait-x', `${y.toFixed(2)}deg`);
    portrait.style.setProperty('--portrait-y', `${x.toFixed(2)}deg`);
  });
});
portrait.addEventListener('pointerleave', () => {
  cancelAnimationFrame(portraitFrame);
  portrait.style.removeProperty('--portrait-x');
  portrait.style.removeProperty('--portrait-y');
});

// A deliberately small diagnostic game: pick the next thing to investigate.
const pcCases = [
  { part:'gpu', fault:'gpu', title:'Fans on. Screen off.', clue:'The monitor cable is connected to the graphics card and the correct input is selected. The motherboard’s white VGA light stays on.', screen:'NO SIGNAL', detail:'Is this thing on?', fix:'Right area. The VGA indicator points to graphics initialisation. Power off and unplug before checking the card’s seating and power connections.', quip:'The graphics card has entered its mysterious era.' },
  { part:'ram', fault:'ram', title:'Orange light. Zero progress.', clue:'After a memory upgrade, the PC does not POST. The amber indicator labelled DRAM stays on after the initial memory-training period.', screen:'NO POST', detail:'DRAM indicator lit', fix:'RAM is the first check here. Power off and unplug, check seating and the recommended slots, then test one module at a time.', quip:'One of those RAM clips may have other plans.' },
  { part:'ssd', fault:'ssd', title:'The BIOS is lonely.', clue:'The BIOS opens normally, but the SSD that held the operating system is missing from its storage list. It was listed yesterday.', screen:'NO BOOT DEVICE', detail:'Where did the drive go?', fix:'Check the missing SSD and its connection first. A missing drive needs investigating before reinstalling an operating system.', quip:'The operating system has been stood up.' },
  { part:'cooler', fault:'cooler', title:'A very brief gaming session.', clue:'The CPU temperature climbs rapidly towards 100°C and the PC shuts down. The CPU cooler fan is not spinning.', screen:'CPU TEMP: 100°C', detail:'A little too toasty', fix:'Check the CPU cooler. Shut the PC down, then check the fan connection and cooler mounting before running it again.', quip:'That is not the kind of high score we wanted.' },
  { part:'cable', fault:'cable', title:'Wrong channel.', clue:'The PC finishes booting. The monitor is set to HDMI 2, but the cable from the graphics card is plugged into HDMI 1.', screen:'HDMI 2: NO SIGNAL', detail:'The PC is innocent', fix:'Select HDMI 1 on the monitor. The clue points to the display connection and input, not a failed graphics card.', quip:'An expensive PC, defeated by the input button.' },
  { part:'psu', fault:'psu', title:'Absolutely nothing.', clue:'The wall socket and power lead have been checked and the rear switch is on. Nothing spins, and a suitable PSU tester reports no 12 V output.', screen:'', detail:'', fix:'The power supply is the next check. Investigate or replace the unit; do not open the PSU enclosure.', quip:'The power supply has taken an unscheduled day off.' },
];
const game = document.getElementById('pc-game');
const gameScene = document.getElementById('pc-scene');
const componentButtons = [...game.querySelectorAll('button[data-part]')];
const gameFeedback = document.getElementById('game-feedback');
const nextCaseButton = document.getElementById('game-next');
let caseIndex = 0;
let firstTryFixes = 0;
let caseAttempts = 0;
let caseSolved = false;
function renderCase() {
  const problem = pcCases[caseIndex];
  caseAttempts = 0;
  caseSolved = false;
  gameScene.dataset.fault = problem.fault;
  gameScene.classList.remove('is-fixed');
  document.getElementById('game-progress').textContent = `Case ${caseIndex + 1} of ${pcCases.length}`;
  document.getElementById('fault-title').textContent = problem.title;
  document.getElementById('fault-clue').textContent = problem.clue;
  document.getElementById('monitor-message').textContent = problem.screen;
  document.getElementById('monitor-detail').textContent = problem.detail;
  gameFeedback.textContent = 'Select a component in the PC or use the buttons.';
  gameFeedback.removeAttribute('data-result');
  componentButtons.forEach(button => { button.disabled = false; button.classList.remove('part-correct','part-wrong'); });
  nextCaseButton.hidden = true;
  document.getElementById('game-score').textContent = `First-try fixes: ${firstTryFixes} / ${caseIndex}`;
}
function chooseComponent(part) {
  if (caseSolved) return;
  caseAttempts++;
  const problem = pcCases[caseIndex];
  componentButtons.forEach(button => button.classList.remove('part-wrong'));
  if (part !== problem.part) {
    gameFeedback.dataset.result = 'wrong';
    gameFeedback.textContent = 'Not the first check for these symptoms. Look at the clue and try another component.';
    componentButtons.filter(button => button.dataset.part === part).forEach(button => button.classList.add('part-wrong'));
    return;
  }
  caseSolved = true;
  if (caseAttempts === 1) firstTryFixes++;
  gameScene.dataset.fault = 'none';
  gameScene.classList.add('is-fixed');
  document.getElementById('monitor-message').textContent = 'BOOT OK';
  document.getElementById('monitor-detail').textContent = 'Nice one.';
  componentButtons.forEach(button => { button.disabled = true; button.classList.toggle('part-correct', button.dataset.part === part); });
  gameFeedback.dataset.result = 'correct';
  gameFeedback.textContent = `${problem.quip} ${problem.fix}`;
  document.getElementById('game-score').textContent = `First-try fixes: ${firstTryFixes} / ${caseIndex + 1}`;
  nextCaseButton.hidden = false;
  nextCaseButton.textContent = caseIndex === pcCases.length - 1 ? 'Play again ↻' : 'Next problem →';
  if (caseIndex === pcCases.length - 1) document.getElementById('game-progress').textContent = `Bench cleared · ${firstTryFixes}/${pcCases.length} first try`;
}
componentButtons.forEach(button => button.addEventListener('click', () => chooseComponent(button.dataset.part)));
nextCaseButton.addEventListener('click', () => {
  if (!caseSolved) return;
  if (caseIndex === pcCases.length - 1) { caseIndex = 0; firstTryFixes = 0; }
  else caseIndex++;
  renderCase();
  document.getElementById('fault-title').focus({preventScroll:true});
});
document.getElementById('game-restart').addEventListener('click', () => { caseIndex = 0; firstTryFixes = 0; renderCase(); });
renderCase();
if ('IntersectionObserver' in window) {
  const benchObserver = new IntersectionObserver(entries => {
    for (const entry of entries) gameScene.classList.toggle('bench-visible', entry.isIntersecting);
  });
  benchObserver.observe(gameScene);
}
game.addEventListener('pc-part-select', event => {
  if (['gpu','ram','cooler','ssd','psu','cable'].includes(event.detail?.part)) chooseComponent(event.detail.part);
});

const jarvisViewButtons = [...document.querySelectorAll('.jarvis-view-picker button')];
const jarvisPreview = document.getElementById('jarvis-preview-image');
const jarvisPreviewFrame = document.querySelector('.jarvis-preview');
jarvisViewButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    jarvisViewButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    jarvisPreview.src = button.dataset.image;
    jarvisPreview.alt = button.dataset.alt;
    document.getElementById('jarvis-preview-title').textContent = button.dataset.title;
    document.getElementById('jarvis-preview-caption').textContent = button.dataset.caption;
    jarvisPreviewFrame.dataset.view = button.dataset.view;
  });
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % jarvisViewButtons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + jarvisViewButtons.length - 1) % jarvisViewButtons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = jarvisViewButtons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    jarvisViewButtons[next].focus();
    jarvisViewButtons[next].click();
  });
});

const jarvisOrbButtons = [...document.querySelectorAll('.jarvis-orb-controls button')];
const jarvisOrbImage = document.getElementById('jarvis-orb-image');
const jarvisOrbTitle = document.querySelector('.jarvis-orb-status strong');
const jarvisOrbCopy = document.querySelector('.jarvis-orb-status span');
let jarvisOrbLoadId = 0;
jarvisOrbButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    jarvisOrbButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    jarvisOrbTitle.textContent = button.dataset.title;
    jarvisOrbCopy.textContent = button.dataset.copy;
    const nextSource = new URL(button.dataset.image, document.baseURI).href;
    if (jarvisOrbImage.src === nextSource) return;
    const loadId = ++jarvisOrbLoadId;
    const nextImage = new Image();
    jarvisOrbImage.classList.add('is-switching');
    nextImage.onload = () => {
      if (loadId !== jarvisOrbLoadId) return;
      jarvisOrbImage.src = nextImage.src;
      jarvisOrbImage.alt = button.dataset.alt;
      jarvisOrbImage.classList.remove('is-switching');
    };
    nextImage.onerror = () => {
      if (loadId === jarvisOrbLoadId) jarvisOrbImage.classList.remove('is-switching');
    };
    nextImage.src = nextSource;
  });
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % jarvisOrbButtons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + jarvisOrbButtons.length - 1) % jarvisOrbButtons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = jarvisOrbButtons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    jarvisOrbButtons[next].focus();
    jarvisOrbButtons[next].click();
  });
});
