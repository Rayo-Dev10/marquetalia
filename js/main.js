(function () {
  const hasGlobalSlidesConst = typeof slides !== "undefined" && Array.isArray(slides);
  const slideData = Array.isArray(window.slidesData)
    ? window.slidesData
    : hasGlobalSlidesConst
      ? slides
      : Array.isArray(window.slides)
        ? window.slides
        : [];

  const slidesContainer = document.getElementById("slides");
  const bgImage = document.getElementById("bgImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const soundBtn = document.getElementById("soundBtn");
  const counter = document.getElementById("counter");
  const progressBar = document.getElementById("progressBar");

  if (!slidesContainer || !bgImage || !prevBtn || !nextBtn || !fullscreenBtn || !soundBtn || !counter || !progressBar) {
    return;
  }

  if (slideData.length === 0) {
    slidesContainer.innerHTML = "<section class=\"slide active\"><article class=\"panel main\"><h1>Sin diapositivas</h1><p class=\"lede\">No se cargó contenido en <code>js/slides.js</code>.</p></article><aside class=\"panel side\"></aside></section>";
    counter.textContent = "0 / 0";
    progressBar.style.width = "0%";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const audioCtxClass = window.AudioContext || window.webkitAudioContext;
  const state = {
    index: 0,
    soundEnabled: true,
  };

  let audioCtx = null;
  let slideElements = [];

  function slideTemplate(slide, index) {
    const eyebrow = slide.eyebrow || "";
    const title = slide.title || "";
    const subtitle = slide.subtitle || "";
    const main = slide.main || "";
    const sideTop = slide.sideTop || "";
    const sideMid = slide.sideMid || "";
    const sideBottom = slide.sideBottom || "";

    return `
      <section class="slide" data-index="${index}" aria-label="Diapositiva ${index + 1}">
        <article class="panel main">
          <span class="eyebrow">${eyebrow}</span>
          <h1>${title}</h1>
          <p class="lede">${subtitle}</p>
          <div class="copy">${main}</div>
        </article>
        <aside class="panel side">
          <div>${sideTop}</div>
          <div>${sideMid}</div>
          <div>${sideBottom}</div>
        </aside>
      </section>
    `;
  }

  function renderSlides() {
    slidesContainer.innerHTML = slideData.map((slide, index) => slideTemplate(slide, index)).join("");
    slideElements = Array.from(slidesContainer.querySelectorAll(".slide"));
  }

  function getWrappedIndex(index) {
    const total = slideData.length;
    return ((index % total) + total) % total;
  }

  function updateButtons() {
    prevBtn.disabled = slideData.length <= 1;
    nextBtn.disabled = slideData.length <= 1;
  }

  function updateFullscreenButton() {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenBtn.textContent = isFullscreen ? "🡼 Salir pantalla" : "⛶ Pantalla completa";
  }

  function updateSoundButton() {
    soundBtn.textContent = state.soundEnabled ? "🔊 Sonido: ON" : "🔇 Sonido: OFF";
  }

  function playClickSound() {
    if (!state.soundEnabled || !audioCtxClass) {
      return;
    }

    if (!audioCtx) {
      audioCtx = new audioCtxClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }

    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  function updateUI(nextIndex) {
    state.index = getWrappedIndex(nextIndex);
    const total = slideData.length;

    slideElements.forEach((element, idx) => {
      element.classList.remove("active", "prev");
      if (idx === state.index) {
        element.classList.add("active");
      }
      if (idx === getWrappedIndex(state.index - 1)) {
        element.classList.add("prev");
      }
    });

    const currentSlide = slideData[state.index];
    bgImage.style.backgroundImage = `url("${currentSlide.bg}")`;
    bgImage.style.transform = `scale(${(1.04 + Math.random() * 0.08).toFixed(3)})`;

    counter.textContent = `${state.index + 1} / ${total}`;
    progressBar.style.width = `${((state.index + 1) / total) * 100}%`;
  }

  function goTo(index) {
    updateUI(index);
    playClickSound();
  }

  function nextSlide() {
    goTo(state.index + 1);
  }

  function prevSlide() {
    goTo(state.index - 1);
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    updateSoundButton();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
      return;
    }
    document.exitFullscreen().catch(function () {});
  }

  function handleKeydown(event) {
    if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.isContentEditable)) {
      return;
    }

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
        event.preventDefault();
        prevSlide();
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(slideData.length - 1);
        break;
      case "f":
      case "F":
        event.preventDefault();
        toggleFullscreen();
        break;
      case "m":
      case "M":
        event.preventDefault();
        toggleSound();
        break;
      default:
        break;
    }
  }

  function bindEvents() {
    prevBtn.addEventListener("click", prevSlide);
    nextBtn.addEventListener("click", nextSlide);
    soundBtn.addEventListener("click", toggleSound);
    fullscreenBtn.addEventListener("click", toggleFullscreen);

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("fullscreenchange", updateFullscreenButton);
  }

  function init() {
    renderSlides();
    bindEvents();
    updateButtons();
    updateSoundButton();
    updateFullscreenButton();
    updateUI(0);
  }

  init();
})();

