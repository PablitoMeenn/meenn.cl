/* main.js: comportamiento del sitio en JavaScript puro (sin jQuery ni librerías externas).
   Cada función se encarga de una parte de la página; todas se llaman al final del archivo. */
(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ----- Pantalla de carga: se desvanece y luego se quita -----
	function loaderPage() {
		var loader = document.querySelector('.fh5co-loader');
		if (!loader) return;
		loader.classList.add('is-hidden');
		setTimeout(function () { loader.remove(); }, 700);
	}

	// ----- Menú lateral para celular (copia los enlaces del menú principal) -----
	function offcanvasMenu() {
		var page = document.getElementById('page');
		var menu = document.querySelector('.menu-1 > ul');
		if (!page || !menu) return;

		var panel = document.createElement('div');
		panel.id = 'fh5co-offcanvas';
		panel.appendChild(menu.cloneNode(true));

		var toggle = document.createElement('a');
		toggle.href = '#';
		toggle.className = 'js-fh5co-nav-toggle fh5co-nav-toggle fh5co-nav-white';
		toggle.setAttribute('role', 'button');
		toggle.setAttribute('aria-label', 'Abrir o cerrar el menú');
		toggle.setAttribute('aria-expanded', 'false');
		toggle.appendChild(document.createElement('i'));

		page.prepend(panel);
		page.prepend(toggle);

		function setOpen(open) {
			document.body.classList.toggle('overflow', open);
			document.body.classList.toggle('offcanvas', open);
			toggle.classList.toggle('active', open);
			toggle.setAttribute('aria-expanded', String(open));
		}

		toggle.addEventListener('click', function (event) {
			event.preventDefault();
			setOpen(!document.body.classList.contains('offcanvas'));
		});

		// Se cierra al hacer clic fuera del menú o al cambiar el tamaño de la ventana
		document.addEventListener('click', function (event) {
			if (!panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
		});
		window.addEventListener('resize', function () { setOpen(false); });
	}

	// ----- Animaciones de aparición al hacer scroll (elementos con clase "animate-box") -----
	function contentAnimations() {
		var boxes = document.querySelectorAll('.animate-box');
		var effects = { fadeIn: 'fadeIn', fadeInLeft: 'fadeInLeft', fadeInRight: 'fadeInRight' };

		function show(el, delay) {
			setTimeout(function () {
				el.classList.add(effects[el.dataset.animateEffect] || 'fadeInUp', 'animated-fast');
			}, delay);
		}

		if (!('IntersectionObserver' in window) || reduceMotion) {
			boxes.forEach(function (el) { show(el, 0); });
			return;
		}

		var observer = new IntersectionObserver(function (entries) {
			var k = 0;
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				observer.unobserve(entry.target);
				show(entry.target, 100 + Math.min(k, 6) * 200); // los que aparecen juntos entran en cascada
				k++;
			});
		}, { rootMargin: '0px 0px -15% 0px' });

		boxes.forEach(function (el) { observer.observe(el); });
	}

	// ----- Contadores animados (el valor final está en data-to, la duración en data-speed) -----
	function counters() {
		var section = document.getElementById('fh5co-counter');
		if (!section) return;

		function run() {
			section.querySelectorAll('.js-counter').forEach(function (el) {
				var from = Number(el.dataset.from) || 0;
				var to = Number(el.dataset.to) || 0;
				var duration = reduceMotion ? 0 : (Number(el.dataset.speed) || 2000);
				var start = null;

				function step(now) {
					if (start === null) start = now;
					var progress = duration ? Math.min((now - start) / duration, 1) : 1;
					el.textContent = Math.round(from + (to - from) * progress);
					if (progress < 1) requestAnimationFrame(step);
				}
				requestAnimationFrame(step);
			});
		}

		if (!('IntersectionObserver' in window)) { run(); return; }

		var observer = new IntersectionObserver(function (entries) {
			if (entries.some(function (e) { return e.isIntersecting; })) {
				observer.disconnect();
				run();
			}
		}, { rootMargin: '0px 0px -10% 0px' });
		observer.observe(section);
	}

	// ----- Carrusel de mensajes: crea los puntos y marca el mensaje visible -----
	function testimonialCarousel() {
		var carousel = document.querySelector('.testimony-carousel');
		if (!carousel) return;
		var slides = carousel.querySelectorAll('.item');
		if (slides.length < 2) return;

		var dots = document.createElement('div');
		dots.className = 'carousel-dots';

		slides.forEach(function (slide, i) {
			var dot = document.createElement('button');
			dot.type = 'button';
			dot.setAttribute('aria-label', 'Ver mensaje ' + (i + 1) + ' de ' + slides.length);
			dot.addEventListener('click', function () {
				carousel.scrollTo({ left: i * carousel.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
			});
			dots.appendChild(dot);
		});
		carousel.after(dots);

		function update() {
			var current = Math.round(carousel.scrollLeft / carousel.clientWidth);
			Array.prototype.forEach.call(dots.children, function (dot, i) {
				dot.classList.toggle('active', i === current);
			});
		}
		carousel.addEventListener('scroll', update, { passive: true });
		update();
	}

	// ----- Visor de fotos de la galería (clic para ampliar, flechas para avanzar, Esc para cerrar) -----
	function galleryLightbox() {
		var links = Array.prototype.slice.call(document.querySelectorAll('#fh5co-gallery-list a'));
		if (!links.length || typeof HTMLDialogElement === 'undefined') return; // sin soporte: el enlace abre la foto

		var dialog = document.createElement('dialog');
		dialog.className = 'lightbox';
		dialog.setAttribute('aria-label', 'Visor de fotos');
		dialog.innerHTML =
			'<button type="button" class="lightbox-close" aria-label="Cerrar">&times;</button>' +
			'<button type="button" class="lightbox-prev" aria-label="Foto anterior">&#8249;</button>' +
			'<figure><img alt=""><figcaption></figcaption></figure>' +
			'<button type="button" class="lightbox-next" aria-label="Foto siguiente">&#8250;</button>';
		document.body.appendChild(dialog);

		var img = dialog.querySelector('img');
		var caption = dialog.querySelector('figcaption');
		var current = 0;

		function show(index) {
			current = (index + links.length) % links.length;
			var link = links[current];
			var title = link.querySelector('h2');
			img.src = link.href;
			img.alt = title ? title.textContent : '';
			caption.textContent = img.alt;
		}

		links.forEach(function (link, i) {
			link.addEventListener('click', function (event) {
				event.preventDefault();
				show(i);
				dialog.showModal();
			});
		});

		dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
		dialog.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
		dialog.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });

		// Clic en el fondo oscuro (fuera de la foto) cierra el visor
		dialog.addEventListener('click', function (event) {
			if (event.target === dialog) dialog.close();
		});
		dialog.addEventListener('keydown', function (event) {
			if (event.key === 'ArrowLeft') show(current - 1);
			if (event.key === 'ArrowRight') show(current + 1);
		});
		dialog.addEventListener('close', function () { img.removeAttribute('src'); });
	}

	// ----- Botón "volver arriba" y efecto parallax de la portada -----
	function scrollEffects() {
		var topButton = document.querySelector('.js-top');
		var goTop = document.querySelector('.js-gotop');
		var cover = document.querySelector('[data-stellar-background-ratio]');
		var ratio = cover ? Number(cover.dataset.stellarBackgroundRatio) || 0 : 0;
		var ticking = false;

		if (goTop) {
			goTop.addEventListener('click', function (event) {
				event.preventDefault();
				window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
			});
		}

		function update() {
			ticking = false;
			var y = window.scrollY;
			if (topButton) topButton.classList.toggle('active', y > 200);
			if (cover && !reduceMotion && y < cover.offsetHeight) {
				cover.style.backgroundPositionY = Math.round(y * ratio) + 'px';
			}
		}

		window.addEventListener('scroll', function () {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(update);
			}
		}, { passive: true });
		update();
	}

	// ----- Inicio: se ejecuta todo cuando el HTML ya está cargado -----
	function init() {
		offcanvasMenu();
		contentAnimations();
		counters();
		testimonialCarousel();
		galleryLightbox();
		scrollEffects();
		loaderPage();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
}());
