(function($) {

	"use strict";

	/**
	 * ----------------------------------------------------------------------------------------
	 *    GLOBALS
	 * ----------------------------------------------------------------------------------------
	 */

	var $window = $(window);
	var $document = $(document);
	var $html = $('html');
	var $body = $('body');
	var $footer = $('.footer');
	var isMobile = false;

	var $mainContent = $('.MAIN-CONTENT');


	// Navigation
	var $navSticky = $('.is-nav-sticky');

	// Sticky Kit
	var $stickyKit = $('.is-sticky-kit');

	var initBgSegmentsFunction = false;

	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || typeof window.orientation !== "undefined") {
		isMobile = true;
	}

	// Returns True if browser is IE

	function isIE() {
		var ua = navigator.userAgent;
		/* MSIE used to detect old browsers and Trident used to newer ones*/
		var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;

		return is_ie;
	}



	/**
	* ----------------------------------------------------------------------------------------
	*    JS Checker
	* ----------------------------------------------------------------------------------------
	*/

	document.documentElement.className = document.documentElement.className.replace("no-js", "js");

	/**
	* ----------------------------------------------------------------------------------------
	*    Mobile Checker
	* ----------------------------------------------------------------------------------------
	*/
	if (isMobile) {
		$('body').addClass('body-mobile');
	}


	/**
	* ----------------------------------------------------------------------------------------
	*    Fixes Bug on iOS that stops hovered elements from hiding when tapped outside
	* ----------------------------------------------------------------------------------------
	*/

	if (isMobile) {
		$body.css('cursor', 'pointer');
	}

	/**
	* ----------------------------------------------------------------------------------------
	*    GLOBAL Functions
	* ----------------------------------------------------------------------------------------
	*/

	// Get URL Parameter
	function getUrlParameter(name) {
		var sPageURL = decodeURIComponent(window.location.search);
		return (RegExp(name + '=' + '(.*?)(&|$)').exec(sPageURL) || ['', ''])[1];
	}

	// Remove URL Parameter
	function removeUrlParameter(name) {
		var sPageURL = document.location.origin + document.location.pathname + decodeURIComponent(window.location.search);
		// var re = new RegExp('&' + name + '=\d+');
		var re = new RegExp('&' + name + '=(?:\\d+|\\w+)');
		sPageURL = sPageURL.replace(re, '');
		history.pushState({}, '', sPageURL);
	}

	/**
	* Returns a random integer between min (inclusive) and max (inclusive)
	* Using Math.round() will give you a non-uniform distribution!
	*/
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	*  Shade Color
	*/
	function shadeColor(color, percent) {
		var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
		return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
	}

	/**
	*  Converts rgba(xxx, xxx, xxx, x) to hex
	*/
	function hexc(colorval) {
		var parts = colorval.match(/^rgba*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(?:\d+)*.*(?:\d+)*)*\)$/);
		if (!parts) {
			return;
		}
		delete (parts[0]);
		for (var i = 1; i <= 3; ++i) {
			parts[i] = parseInt(parts[i]).toString(16);
			if (parts[i].length == 1) parts[i] = '0' + parts[i];
		}
		return '#' + parts.join('');
	}

	/**
	*  Checks of color is dark
	*/
	function isColorDark(hexColor) {
		var c = hexColor.substring(1);      // strip #
		var rgb = parseInt(c, 16);   // convert rrggbb to decimal
		var r = (rgb >> 16) & 0xff;  // extract red
		var g = (rgb >> 8) & 0xff;  // extract green
		var b = (rgb >> 0) & 0xff;  // extract blue

		var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

		if (luma < 40) {
			return true;
		}
		return false;
	}


	/**
	*  Scroll in View
	*/
	$.fn.inView = function () {
		var $this = this;
		var docViewTop = $window.scrollTop();
		var docViewBottom = docViewTop + $window.height();
		var elemTop = $this.offset().top;
		var elemBottom = elemTop + $this.height() + 160;
		if (((docViewTop <= elemBottom) && (docViewBottom >= elemTop)) || (isMobile == true)) {
			return true;
		}
		else {
			return false;
		}
	}


	/**
	*  Get Parent Background
	*/
	$.fn.getParentBG = function () {

		var $this = this;

		if ($this.children('.bg-color').length) {
			return $this.children('.bg-color').css("background-color");
		}

		// Is current element's background color set?
		var color = $this.css("background-color");
		if (color == 'transparent') {
			color = 'rgba(0, 0, 0, 0)';
		}
		if (color !== 'rgba(0, 0, 0, 0)') {
			// if so then return that color
			return color;
		}

		// are you at the body element?
		if ($this.is("body")) {
			// return known 'false' value
			return false;
		} else {
			// call getParentBG with parent item
			return $this.parent().getParentBG();
		}

	}


	/**
	* ----------------------------------------------------------------------------------------
	*    Activate and Reset anim- Animations
	* ----------------------------------------------------------------------------------------
	*/

	$.fn.activateAnimations = function () {

		var self = this;

		self.find('*').filter(function () {

			if (typeof this.className == 'string') {
				var classes = this.className.split(' ');
				var found = false;

				if (classes) {
					for (var i = 0, len = classes.length; i < len; i++) {
						if (/^anim-/.test(classes[i])) found = true;
						if (/^anim-onload/.test(classes[i])) return false;
					}
					if (found == true) {
						return true;
					}
				}
			}

			return false;
		}).each(function () {
			$(this).addClass('anim-activated');
		})

	};



	$.fn.resetAnimations = function () {

		var self = this;

		self.find('*').filter(function () {

			if (typeof this.className == 'string') {
				var classes = this.className.split(' ');
				var found = false;

				if (classes) {
					for (var i = 0, len = classes.length; i < len; i++) {
						if (/^anim-/.test(classes[i])) found = true;
						if (/^anim-onload/.test(classes[i])) return false;
					}
					if (found == true) {
						return true;
					}
				}
			}

			return false;
		}).each(function () {
			$(this).removeClass('anim-activated');
		})

	};


	/**
	* ----------------------------------------------------------------------------------------
	*   Set Background Image or Color
	* ----------------------------------------------------------------------------------------
	*/

	function setBgImage() {
		var $bgimage = $('.bg-image');
		$bgimage.each(function () {
			var $this = $(this);
			var bgimage = $this.data('bg-image')
			if ($this.css('background-image') != 'url("' + bgimage + '")') {
				$this.css('background-image', 'url("' + bgimage + '")');
			}

		})

		var $bgColor = $('.bg-color');
		$bgColor.each(function () {
			var $this = $(this);
			var bgColor = $this.data('bg-color');
			if ($this.css('background-color') != bgColor) {
				$this.css('background-color', bgColor);
			}
			var opacity = $this.data('opacity');
			if (typeof $this.data('opacity') != 'undefined' && $this.css('opacity') != opacity) {
				$this.css('opacity', opacity);
			}
		})
	}

	setBgImage();

	$window.on('refreshisotope', function (e) {
		setBgImage();
	});


	/**
	* ----------------------------------------------------------------------------------------
	*    100vh Fix for Mobile
	* ----------------------------------------------------------------------------------------
	*/

	// function setMobileFullHeight() {
	// 	var viewportHeight = window.innerHeight;
	// 	$('.book-container, .bb-custom-wrapper').css('height', window.innerHeight);
	// }

	// if (isMobile) {
	// 	setMobileFullHeight();
	// }


	// $window.on('resize scroll orientationchange', function (e) {
	// 	if (isMobile && $('.book-container.showBook').length > 0) {
	// 		setMobileFullHeight();
	// 	}
	// });

	function setMobileVH() {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}

	setMobileVH();

	window.addEventListener('resize', () => {
		setMobileVH();
	});


	/**
	* ----------------------------------------------------------------------------------------
	*    Admin Bar
	* ----------------------------------------------------------------------------------------
	*/

	// Makes the bar have better visibility on desktop and mobile

	$('#wpadminbar').css('z-index', '99999999');

	function positionAdminBar(){
		var windowWidth = window.innerWidth;

		if ( windowWidth <= 782 ) {
			$('#wpadminbar').css('position', 'fixed');
		}
	}

	$window.on('resize',function(){
		positionAdminBar();
	});

	/**
	* ----------------------------------------------------------------------------------------
	*    Remove Empty Paragraphs
	* ----------------------------------------------------------------------------------------
	*/

	$('p').filter(function () {
		return !$.trim($(this).html());
	}).remove();

	/**
	* ----------------------------------------------------------------------------------------
	*    Nav Menu
	* ----------------------------------------------------------------------------------------
	*/
	$('.main-navigation-menu').find('.menu-item-has-children a').each(function () {

		var $this = $(this);

		if ($this.next().hasClass('sub-menu')) {
			$this.append('<i class="fas fa-angle-down"></i>');
		}

	})


	/**
	* ----------------------------------------------------------------------------------------
	*    Isotope
	* ----------------------------------------------------------------------------------------
	*/

	var isotopeCols = 0;

	var itemGutter = 0;

	var startIsotopemethods = {
		init: function (options) {


			var $this = (this);

			$this.startIsotope('setOptions');

			var isotopeType = $this.data('isotope-type');

			if (isotopeType == null) {
				isotopeType = 'masonry';
			}

			itemGutter = $this.data('isotope-gutter');

			// Fires Layout when all images are loaded
			$this.imagesLoaded(function () {
				$this.show();

				// Isotope Init
				$this.isotope({
					transitionDuration: '.3s',
					layoutMode: isotopeType,
					masonry: {
						gutter: itemGutter
					},
				});

				$window.trigger('refreshisotope');
			});


			// Set the items width on resize
			// $window.on('resize refreshisotope', function (){
			$window.on('refreshisotope', function () {
				$this.startIsotope('refresh');
			});


		},
		setOptions: function () {

			var $this = $(this);

			$this.imagesLoaded(function () {

				// SET ISOTOPE GUTTER AND SPACINGS
				$this.width($this.parent().width() + 1);

				if (typeof ($this.data('isotope-gutter')) != 'undefined' && $this.data('isotope-gutter') !== null && $this.data('isotope-gutter') != 0) {

					$this.css({
						'margin-right': - itemGutter + 'px',
						'margin-top': itemGutter + 'px',
					})

					$this.children().css({
						'margin-bottom': itemGutter + 'px',
						'overflow': 'hidden'
					})

				}

				// SET ISOTOPE COLUMNS

				var windowWidth = window.innerWidth;

				if (windowWidth <= 478) {
					if (typeof $this.data('isotope-cols-xs') != 'undefined') {
						isotopeCols = $this.data('isotope-cols-xs');
					} else {
						isotopeCols = 1;
					}
				}
				else if (windowWidth <= 767) {
					if (typeof $this.data('isotope-cols-xs') != 'undefined') {
						isotopeCols = $this.data('isotope-cols-xs');
					} else if (typeof $this.data('isotope-cols-sm') != 'undefined') {
						isotopeCols = $this.data('isotope-cols-sm');
					} else if ($this.data('isotope-cols') == 1) {
						isotopeCols = 1;
					} else {
						isotopeCols = 2;
					}
				} else if (windowWidth < 992) {
					if (typeof $this.data('isotope-cols-sm') != 'undefined') {
						isotopeCols = $this.data('isotope-cols-sm');
					} else if ($this.data('isotope-cols') > 2) {
						isotopeCols = $this.data('isotope-cols') - 1;
					} else {
						isotopeCols = $this.data('isotope-cols');
					}

				} else {
					if (typeof $this.data('isotope-cols') == 'undefined') {
						isotopeCols = 3;
					} else {
						isotopeCols = $this.data('isotope-cols');
					}

				}

				if (isotopeCols >= 2) {
					// $this.children().not('.isotope-item-width-2').css('width', Math.floor($this.width() / isotopeCols - itemGutter) + 'px' );
					$this.children().not('.isotope-item-width-2').css('width', Math.floor(($this.width() - (itemGutter * (isotopeCols - 1))) / isotopeCols) + 'px');
					$this.children('.isotope-item-width-2').css('width', Math.floor(($this.width() / isotopeCols) * 2 - 2) + 'px');
				} else {
					$this.children().css('width', $this.width() / isotopeCols - 1 + 'px');
				}

				if ($this.data('isotope-square') == true) {
					var itemsHeight = $this.children().not('.isotope-item-width-2').width();
					$this.children().css('height', itemsHeight + 'px');
				}

				if ($this.find('.is-aspectratio').length > 0) {

					var elWidth = $this.find('.is-aspectratio').width();

					$this.find('.is-aspectratio').each(function () {
						var $el = $(this);
						var height = 0;
						var landscapeHeight = 0;

						if ($el.hasClass('ar_4_3')) {
							height = elWidth / 1.333;
						}
						if ($el.hasClass('ar_1_1')) {
							height = elWidth;
						}
						if ($el.hasClass('ar_3_2')) {
							height = elWidth / 1.5;
						}
						if ($el.hasClass('ar_16_9')) {
							height = elWidth / 1.777;
						}
						if ($el.hasClass('ar_3_1')) {
							height = elWidth / 3;
						}

						if ($el.hasClass('ar_3_4')) {
							height = elWidth / 0.75;
						}
						if ($el.hasClass('ar_2_3')) {
							height = elWidth / 0.666;
						}
						if ($el.hasClass('ar_9_16')) {
							height = elWidth / 0.5625;
						}
						if ($el.hasClass('ar_1_3')) {
							height = elWidth / 0.333;
						}

						// searches if there are landcape items
						landscapeHeight = $this.find('.is-autox-landscape').height();

						// checks if the current item is portrait
						if ($el.hasClass('is-autox-portrait')) {
							// if landscapeHeight is greater than 0, it means that there is at least one landscape image
							if (landscapeHeight > 0) {
								//
								// tuk moje bi trqbva da se promeni na:
								// $el.height(Math.floor(height + $this.data('isotope-gutter')));	
								// poneje dva puti zavurta isotope, vtoriqt pyt sa tochno ichisleni height-a na tozi element, no ne i na landscape elementa
								$el.height(Math.floor(landscapeHeight * 2 + $this.data('isotope-gutter')));
							} else {
								$el.height(Math.floor(height));
							}

						} else {
							$el.height(Math.floor(height));
						}

					})
				}

			}) //imagesLoaded

		},
		refresh: function () {
			var $this = $(this);
			var windowWidth = window.innerWidth;

			$this.startIsotope('setOptions');

			if ($this.hasClass('is-isotope-match-height')) {
				if (windowWidth <= 478) {
					$this.find('.is-matchheight').matchHeight({
						remove: true,
					});
				} else {
					$this.find('.is-matchheight').matchHeight({
						byRow: false,
					});
				}
			}

			setTimeout(function () {
				$this.isotope('layout');
			}, 100)

		}
	};


	$.fn.startIsotope = function (methodOrOptions) {
		if (startIsotopemethods[methodOrOptions]) {
			return startIsotopemethods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
			// Default to "init"
			return startIsotopemethods.init.apply(this, arguments);
		} else {
			$.error('Method ' + methodOrOptions + ' does not exist on jQuery.startIsotope');
		}
	};


	var $isotopeContainer = $('.is-isotope');

	$isotopeContainer.each(function () {
		var $this = $(this);

		$this.wrap("<div class='is-resize-sensor'></div>");
		$this.startIsotope();
	})


	function ResizeSensorTriggerRefreshIsotope() {
		$window.trigger('refreshisotope');

		// setTimeout(function(){
		// 	$window.trigger('refreshisotope');
		// }, 200)
	}

	var triggerRefreshIsotope;

	new ResizeSensor(jQuery('.is-resize-sensor'), function () {
		clearTimeout(triggerRefreshIsotope);
		triggerRefreshIsotope = setTimeout(ResizeSensorTriggerRefreshIsotope, 300);
	});

	/**
	* ----------------------------------------------------------------------------------------
	*    Isotope Filter
	* ----------------------------------------------------------------------------------------
	*/

	$document.on('click', '.is-isotope-filter a', function (e) {
		e.preventDefault();
		var $this = $(this);
		var data_target = $this.parents('.is-isotope-filter').data('target');
		var $target = $(data_target);
		var selector = $this.attr('data-filter');
		$this.parents('.is-isotope-filter').find('.selected').removeClass('selected');
		$this.parent('li').addClass('selected');

		$target.isotope({ filter: selector });

		return false;

	});

	if ($('.is-isotope-filter').data('hide-show-all') == '1') {
		$('.is-isotope-filter li:first-child a').trigger('click');
	}


	/**
	* ----------------------------------------------------------------------------------------
	*    Navigation Menu
	* ----------------------------------------------------------------------------------------
	*/

	// Slicknav

	$('.is-slicknav').each(function () {
		var $this = $(this);
		var navColorClass = $this.data('nav-color');
		var $combinedMenu = $('.is-slicknav-navigation-left').clone();
		var $secondMenu = $('.is-slicknav-navigation-right').clone();
		if ($combinedMenu.length) {
			$secondMenu.children('li').appendTo($combinedMenu);
		} else if ($secondMenu.length) {
			$combinedMenu = $secondMenu;
		} else {
			$combinedMenu = $this;
		}
		$combinedMenu.slicknav({
			label: '',
			init: function () {
				var $this = $(this);
				var $logo = $('.main-navigation-container .is-slicknav-logo').clone();
				$('.slicknav_menu').prepend($logo);
				$('.slicknav_menu').addClass(navColorClass);
				$logo.removeClass('navigation-logo').addClass('slicknav_menu_logo');
				$('.slicknav_menu').find('.slicknav_parent').each(function () {
					var $this = $(this);
					if ($this.children().children().first().attr('href') != '#') {
						$this.children().children().first().unbind('click');
						$this.children().children().first().on('click', function (e) {
							e.preventDefault();
							window.location = $this.children().children().first().attr('href');
							$('.slicknav_menu').find('.slicknav_btn').trigger('click');
						})
					}
				})
			}
		})
	})

	var $navOffset = $('.is-nav-offset');
	var currentScrollTop = $window.scrollTop();
	var lastScrollTop = 0;

	function stickyNav() {
		var delta = 5;
		var windowWidth = window.innerWidth;
		var navStickyHeight = $navSticky.innerHeight();

		if ($('.slicknav_menu').is(':visible')) {
			$navOffset.css('padding-top', $('.is-slicknav-logo').innerHeight());
			$('.page > .fw-page-builder-content > .fullscreen-wrapper').each(function () {
				var $this = $(this);
				$this.css('min-height', 'calc(100vh - ' + $('.is-slicknav-logo').innerHeight() + 'px)');
			})
		} else {
			$navOffset.css('padding-top', navStickyHeight);
			$('.page > .fw-page-builder-content > .fullscreen-wrapper').each(function () {
				var $this = $(this);
				$this.css('min-height', 'calc(100vh - ' + navStickyHeight + 'px)');
			})
		}

		if (Math.abs(lastScrollTop - currentScrollTop) <= delta || !$navSticky.is(':visible')) {
			return;
		}

		if (currentScrollTop > lastScrollTop && currentScrollTop > navStickyHeight) {
			$navSticky.removeClass('nav-down').addClass('nav-up');
		}
		else if (currentScrollTop + $window.height() < $document.height()) {
			$navSticky.removeClass('nav-up').addClass('nav-down');
		}
	}

	stickyNav();

	$window.on('scroll', function (e) {
		setTimeout(function () {
			currentScrollTop = $(this).scrollTop();
			stickyNav();
			lastScrollTop = currentScrollTop;
		}, 50);
	});
	$window.on('resize', function (e) {
		currentScrollTop = $(this).scrollTop();
		stickyNav();
		lastScrollTop = currentScrollTop;
	});



	/**
	* ----------------------------------------------------------------------------------------
	*    Perfect Scrollbar
	* ----------------------------------------------------------------------------------------
	*/

	var $perfectScrollbars = '';

	function initPerfectScrollbar() {

		if ($perfectScrollbars != '') {
			$perfectScrollbars.perfectScrollbar('destroy');
		}

		$perfectScrollbars = $('.is-perfect-scrollbar');

		$perfectScrollbars.perfectScrollbar({
			minScrollbarLength: 25,
			maxScrollbarLength: 25,
			scrollYMarginOffset: 0,
			swipePropagation: false,
			wheelPropagation: false,
			suppressScrollX: true
		});

		$('.is-perfect-scrollbar').each(function () {

			var $this = $(this);
			var bgColor = $this.getParentBG();
			if (bgColor) {

				var bgColorHex = hexc(bgColor);
				if (!bgColorHex) {
					return;
				}
				if (isColorDark(bgColorHex)) {
					$this.find('.ps__scrollbar-y').css('border-color', '#fff');
					$this.find('.ps__scrollbar-y-rail').css('border-left', '3px solid #fff');
				} else {
					$this.find('.ps__scrollbar-y').css('border-color', '#000');
					$this.find('.ps__scrollbar-y-rail').css('border-left', '3px solid #000');
				}
			}
		})

		$('.is-perfect-scrollbar').each(function () {

			var $this = $(this);
			var bgColor = $this.getParentBG();

			if (bgColor) {
				$this.find('.ps__scrollbar-y').css('background-color', bgColor);
			}
		})

	}

	initPerfectScrollbar();

	$window.on('throttledresize', function () {
		$('.is-perfect-scrollbar').perfectScrollbar('update');
	});


	/**
	* ----------------------------------------------------------------------------------------
	*    Owl Carousel Adaptive Height
	* ----------------------------------------------------------------------------------------
	*/

	function adaptiveHeight(slider) {
		slider.imagesLoaded(function () {
			slider.find('.owl-height').css('height', slider.find('.owl-item.active').height());
		});
	}


	/**
	* ----------------------------------------------------------------------------------------
	*    Carousel (Owl Carousel)
	* ----------------------------------------------------------------------------------------
	*/

	var $testimonialSlider = $('.testimonial-carousel.owl-carousel');

	$('*[data-owl-autoheight="true"]').on('initialized.owl.carousel resized.owl.carousel', function (event) {
		var $this = $(this);
		adaptiveHeight($this);
	})

	$testimonialSlider.each(function () {
		var $this = $(this);
		var $autoHeight = $testimonialSlider.data('owl-autoheight') ? true : false;
		$this.owlCarousel({
			items: 1,
			autoHeight: $autoHeight,
			loop: true,
			nav: true,
			dots: true,
			dotsData: true,
			dotsClass: 'owl-dots font-subheading',
			navText: []
		})
	});

	var $contentSliderImages = $('.content-slider-images.owl-carousel');
	var $contentSliderContent = $('.content-slider.owl-carousel');

	$contentSliderImages.each(function () {
		var $this = $(this);
		$this.owlCarousel({
			items: 1,
			loop: true,
			nav: false,
			dots: true,
			dotsData: true,
			dotsClass: 'owl-dots'
		})

		$this.on('dragged.owl.carousel', function (event) {
			var sliderImage = event.page.index;
			$this.next($contentSliderContent).trigger('to.owl.carousel', [sliderImage, 350]);
		})
	});
	$contentSliderContent.each(function () {
		var $this = $(this);
		var $autoHeight = '';
		$this.data('owl-autoheight') ? $autoHeight = true : $autoHeight = false;
		$this.owlCarousel({
			items: 1,
			autoHeight: $autoHeight,
			loop: true,
			nav: true,
			dots: true,
			dotsClass: 'owl-dots',
			navText: []
		})

		$this.on('dragged.owl.carousel', function (event) {
			var sliderContent = event.page.index;
			$this.prev($contentSliderImages).trigger('to.owl.carousel', [sliderContent, 350]);
		})
		$this.on('changed.owl.carousel', function (event) {
			var sliderContent = event.page.index;
			$this.prev($contentSliderImages).trigger('to.owl.carousel', [sliderContent, 350]);
		})
	});

	/**
	* ----------------------------------------------------------------------------------------
	*    Parallax
	* ----------------------------------------------------------------------------------------
	*/

	function parallaxScroll() {

		if (isIE()) return false;

		var windowWidth = window.innerWidth;

		if (windowWidth < 992 || isMobile) {
			$('.is-parallax').each(function () {
				var $this = $(this);
				$this.css('background-position', '');
			});
			$('.is-floating').each(function () {
				var $this = $(this);
				$this.css({
					'-webkit-transform': '',
					'-ms-transform': '',
					'transform': ''
				});
			});
			return;
		}

		var docViewTop = $window.scrollTop();
		var docViewBottom = docViewTop + $window.height();

		$('.is-parallax').each(function () {
			var $this = $(this);

			var top = 0;
			top = docViewBottom - $this.offset().top;

			if ($this.offset().top <= $window.scrollTop() + $window.height() + 200) {
				$this.css('background-position', 'left 50% ' + 'top ' + (110 - top * 0.08) + '%');
			} else {
				$this.css('background-position', 'left 50% top 100%');
			}

		})

		$('.is-floating').each(function () {
			var $this = $(this);
			var top = 0;
			if ($this.inView()) {
				top = docViewBottom - $this.offset().top;
				var translateY = 100 - (top * 0.18);
				$this.css({
					'-webkit-transform': 'translateY(' + translateY + 'px)',
					'-ms-transform': 'translateY(' + translateY + 'px)',
					'transform': 'translateY(' + translateY + 'px)'
				});
			}
		})
	}

	parallaxScroll();

	$window.on('scroll throttledresize', function (e) {
		parallaxScroll();
	});


	/**
	* ----------------------------------------------------------------------------------------
	*    Post Share Buttons
	* ----------------------------------------------------------------------------------------
	*/

	$('.is-shareable .facebook').on('click', function (e) {
		e.preventDefault();
		var postUrl = $(this).closest('.is-shareable').data('post-url');
		window.open('http://www.facebook.com/sharer.php?u=' + postUrl, 'sharer', 'toolbar=0,status=0,width=626,height=436');
		return false;
	})

	$('.is-shareable .twitter').on('click', function (e) {
		e.preventDefault();
		var postUrl = $(this).closest('.is-shareable').data('post-url');
		window.open('https://twitter.com/share?url=' + postUrl, 'sharer', 'toolbar=0,status=0,width=626,height=436');
		return false;
	})

	$('.is-shareable .google-plus').on('click', function (e) {
		e.preventDefault();
		var postUrl = $(this).closest('.is-shareable').data('post-url');
		window.open('https://plus.google.com/share?url=' + postUrl, 'sharer', 'toolbar=0,status=0,width=626,height=436');
		return false;
	})

	$('.is-shareable .pinterest').on('click', function (e) {
		e.preventDefault();
		var postUrl = $(this).closest('.is-shareable').data('post-url');
		var img = $('.SinglePostHeader .bg-image').data('bg-image');
		window.open('http://pinterest.com/pin/create/button/?url=' + postUrl + '&media=' + img, 'sharer', 'toolbar=0,status=0,width=626,height=436');
		return false;
	})

	/**
	* ----------------------------------------------------------------------------------------
	*    Match Height
	* ----------------------------------------------------------------------------------------
	*/

	// Section Shortcode
	function triggerMatchHeight() {
		var windowWidth = window.innerWidth;
		if (windowWidth <= 478) {
			$('.is-matchheight').matchHeight({
				remove: true,
			});
			$('.is-matchheight-group').each(function () {
				var $this = $(this);
				$this.children().matchHeight({
					remove: true,
				});
			})
			$('.is-matchheight-container .row, .is-matchheight-container .fw-row').each(function () {
				var $this = $(this);

				if (!$this.parents('.fullscreen-wrapper').length) {
					$this.find('[class^="fw-col-"], [class^="col-"]').matchHeight({
						remove: true
					});
				}

			})
		} else {
			$('.is-matchheight').matchHeight({
				byRow: false
			});
			$('.is-matchheight-group').each(function () {
				var $this = $(this);
				$this.children().matchHeight({
					byRow: true
				});
			})
			$('.is-matchheight-container .row, .is-matchheight-container .fw-row').each(function () {
				var $this = $(this);

				if (!$this.parents('.fullscreen-wrapper').length) {
					$this.find('[class^="fw-col-"], [class^="col-"]').matchHeight({
						byRow: false
					});
				}

			})
		}
	}

	triggerMatchHeight();

	$window.on('throttledresize', function () {
		triggerMatchHeight();
	});
	/**
	* ----------------------------------------------------------------------------------------
	*    Sticky Kit
	* ----------------------------------------------------------------------------------------
	*/


	var stickyKitDetached = true;

	function triggerStickyKit() {
		var windowWidth = window.innerWidth;

		if ((windowWidth < 992) && !stickyKitDetached) {
			$stickyKit.trigger("sticky_kit:detach");
			stickyKitDetached = true;
		} else if (windowWidth >= 992 && stickyKitDetached) {
			setTimeout(function () {
				$stickyKit.stick_in_parent({
					offset_top: $navSticky.innerHeight(),
					recalc_every: 1
				});
				stickyKitDetached = false;
			}, 0)
		}
	}


	setTimeout(function () {
		if (!isMobile) {
			triggerStickyKit();
			$window.on('throttledresize', triggerStickyKit);
		}
	}, 0)

	/**
	* ----------------------------------------------------------------------------------------
	*    Simple Lightbox
	* ----------------------------------------------------------------------------------------
	*/

	var $lightboxes = '';

	var lightbox = [];
	var $lightboxImages = '';

	function initSimpleLightbox() {

		var arrayLength = lightbox.length;
		for (var i = 0; i < arrayLength; i++) {
			lightbox[i].destroy();
		}

		$('.is-lightbox-gallery').each(function () {
			var $this = $(this);
			$lightboxImages = $this.find('*:visible a');

			lightbox.push(new $.SimpleLightbox({
				$items: $lightboxImages,
				nextBtnClass: ' arrow-right',
				prevBtnClass: ' arrow-left',
				prevBtnCaption: '',
				nextBtnCaption: '',
				videoRegex: new RegExp(/youtube.com|vimeo.com/),
			}));

		});

	}

	setTimeout(function () {
		initSimpleLightbox();
	}, 100)

	/**
	* ----------------------------------------------------------------------------------------
	*    Book Panel Rotate
	* ----------------------------------------------------------------------------------------
	*/

	var $bookPanelContainer = $('.books-panel-container');

	$bookPanelContainer.each(function () {
		var $this = $(this);
		var $bookPanelItems = $this.find('.is-book-panel-trigger');

		//  On mobile, scroll to the Book Panel Info
		if (isMobile) {
			$bookPanelItems.on('click', function (e) {
				e.preventDefault();
				var $this = $(this);
				$bookPanelItems.removeClass('selected');
				showBookPanel($this);
			})
		}

		$bookPanelItems.hoverIntent(function (event) {
			var $this = $(this);
			$bookPanelItems.removeClass('selected');
			showBookPanel($this);
		});
		showBookPanel($bookPanelItems.eq(0), true);
	})

	function showBookPanel($selector, dontScrollFlag) {


		$selector.addClass('selected');

		var targetBookID = $selector.data('panel-show');

		$selector.parents('.BooksPanel').find('.books-panel-info-inner').removeClass('show visible');
		var $targetBook = $selector.parents('.BooksPanel').find('.books-panel-info-inner[data-panel-id="' + targetBookID + '"]');
		$targetBook.addClass('show').outerWidth(); //outerWidth used for reflow http://matheusazzi.com/animating-from-display-none-with-css-and-callbacks/


		$targetBook.addClass('visible');


		//  On mobile, scroll to the Book Panel Info
		if (isMobile && !dontScrollFlag) {
			var onTouchScrollTo = $targetBook.offset().top;
			$('html, body').animate({ scrollTop: onTouchScrollTo - 150 }, '500');
		}
	}

	/**
	* ----------------------------------------------------------------------------------------
	*    Events Filter
	* ----------------------------------------------------------------------------------------
	*/

	$('.dropdown').each(function () {

		var $this = $(this);

		var dropdownButton = $this.find('button');
		var currentItem = $this.find('.dropdown-menu li a[data-current="true"]');

		if (currentItem.length > 0) {
			dropdownButton.html(currentItem.clone());
		};

	})

	/**
	* ----------------------------------------------------------------------------------------
	*    Countdown JS
	* ----------------------------------------------------------------------------------------
	*/

	var $upcomingCountdown = $('.is-countdown');
	var monthText = odrin.month;
	var monthsPluralText = odrin.months;
	var dayText = odrin.day;
	var daysPluralText = odrin.days;

	function initCountdown(el) {

		var $this = el;
		var releaseDate = $this.data('release-date');
		var countdownText = '';

		$this.countdown(releaseDate, function (event) {
			if (event.offset.months > 0) {
				countdownText =
					'<span class="countdown-item"><span class="countdown-number font-subheading">%m</span> <span class="countdown-text">%!m:' + monthText + ',' + monthsPluralText + ';</span></span>' +
					'<span class="countdown-item"><span class="countdown-number font-subheading">%n</span> <span class="countdown-text">%!n:' + dayText + ',' + daysPluralText + ';</span></span>' +
					'<span class="countdown-item"><span class="countdown-number font-subheading">%H:%M:%S</span></span>';
			} else if (event.offset.totalDays > 0) {
				countdownText =
					'<span class="countdown-item"><span class="countdown-number font-subheading">%n</span> <span class="countdown-text">%!n:' + dayText + ',' + daysPluralText + ';</span></span>' +
					'<span class="countdown-item"><span class="countdown-number font-subheading">%H:%M:%S</span></span>';
			} else if (event.offset.totalSeconds > 0) {
				countdownText =
					'<span class="countdown-item"><span class="countdown-number font-subheading">%H:%M:%S</span></span>';
			}
			$this.html(event.strftime(countdownText));
		});
		$this.on('finish.countdown', function (event) {
			$this.parent().addClass('countdown-expired')
		})

	}

	$upcomingCountdown.each(function () {
		initCountdown($(this));
	})


	/**
	* ----------------------------------------------------------------------------------------
	*    Page Flip
	* ----------------------------------------------------------------------------------------
	*/


	function bookBlockPage() {

		var $container = $('.book-container'),
			$bookBlock = $('#bb-bookblock'),
			// $items = $bookBlock.children(),
			// itemsCount = $items.length,
			$items = $bookBlock.children(),
			itemsCount = $items.length,
			current = 0,
			bb = $('#bb-bookblock').bookblock({
				speed: 800,
				perspective: 2000,
				shadowSides: 0.8,
				shadowFlip: 0.4,
				onEndFlip: function (old, page, isLimit) {

					current = page;
					// update TOC current
					updateTOC();
					// updateNavigation
					setTimeout(function () {
						updateNavigation(isLimit);
						initPerfectScrollbar();
					}, 100)
				}
			}),
			$navNext = $('#bb-nav-next'),
			$navPrev = $('#bb-nav-prev').hide(),
			$menuItems = $container.find('ul.menu-toc > li'),

			$tblcontents = $('#tblcontents'),
			transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			},
			transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
			supportTransitions = Modernizr.csstransitions;


		function init() {
			updateNavigation( current === itemsCount - 1 );
			// initialize perfectScrollbar on the content div of the first item
			initPerfectScrollbar();
			initEvents();
			$tblcontents.addClass('hovered');


			var readBookChapter = getUrlParameter('read-book-chapter');

			if (readBookChapter) {
				$('.book-container ul.menu-toc > li').eq(readBookChapter).trigger('click');
			}

			setTimeout(function () {
				$tblcontents.removeClass('hovered');
			}, 4000)


		}

		function initEvents() {

			// add navigation events
			$navNext.on('click', function () {
				bb.next();
				return false;
			});

			$navPrev.on('click', function () {
				bb.prev();
				return false;
			});

			// add swipe events
			$items.on({
				'swipeleft': function (event) {
					if ($container.data('opened')) {
						return false;
					}
					bb.next();
					return false;
				},
				'swiperight': function (event) {
					if ($container.data('opened')) {
						return false;
					}
					bb.prev();
					return false;
				}
			});

			// show table of contents
			$tblcontents.on('click', toggleTOC);

			// show table of contents
			$tblcontents.on('hover', function () {
				$tblcontents.removeClass('hovered');
			});

			// click a menu item
			$menuItems.on('click', function () {

				var $el = $(this),
					idx = $el.index(),
					jump = function () {
						bb.jump(idx + 1);
					};

				current !== idx ? closeTOC(jump) : closeTOC();

				removeUrlParameter('read-book-chapter');
				var sPageURL = document.location.origin + document.location.pathname + decodeURIComponent(window.location.search);
				sPageURL += '&read-book-chapter=' + idx;
				history.pushState({}, '', sPageURL);

				return false;

			});


		}

		function updateTOC() {
			$menuItems.removeClass('menu-toc-current').eq(current).addClass('menu-toc-current');
		}

		function updateNavigation( isLastPage ) {
			if( current === 0 && itemsCount == 1 ) {
				$navNext.hide();
				$navPrev.hide();
			} else if( current === 0 ) {
				$navNext.show();
				$navPrev.hide();
			}
			else if( isLastPage ) {
				$navNext.hide();
				$navPrev.show();
			}
			else {
				$navNext.show();
				$navPrev.show();
			}
		}

		function toggleTOC() {
			console.log('toggleTOC');
			var opened = $container.data('opened');
			opened ? closeTOC() : openTOC();
		}

		function openTOC() {
			$navNext.hide();
			$navPrev.hide();
			console.log('openTOC');
			// $container.addClass( 'slideRight' );
			$container.addClass('slideRight').data('opened', true);
			// $container.data( 'opened', true );
			$tblcontents.find('span').text(odrin.hideChapters);
			$tblcontents.find('i').removeClass('icon-search').addClass('close-icon-color');
		}

		function closeTOC(callback) {
			console.log('closeTOC');

			updateNavigation(current === itemsCount - 1);
			$container.removeClass('slideRight').data('opened', false);
			$tblcontents.find('span').text(odrin.showChapters);
			$tblcontents.find('i').removeClass('close-icon-color').addClass('icon-search');
			if (callback) {
				if (supportTransitions) {
					$container.on(transEndEventName, function () {
						$(this).off(transEndEventName);
						callback.call();
					});
				}
				else {
					callback.call();
				}
			}

		}

		return { init: init };

	}

	/**
	* AJAX Success.
	*/

	function ajaxSuccess(html) {
		$('.book-container').remove()
		$('body').prepend(html);

		var Page = bookBlockPage();
		Page.init();

	}

	/**
	* Read Book button.
	*/

	function prevDef(event) {
		event.preventDefault();
	}




	function openFlipBook(event) {
		event.preventDefault();

		var $this = $(this);

		$this.off('click', openFlipBook)
		$this.on('click', prevDef)

		// if a normal button was clicked
		if ($this.hasClass('btn')) {
			var btnHTML = $this.html();
			var btnWidth = $this.width();
			$this.html('<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>' + odrin.loading);
			$this.width(btnWidth);
			$this.prop('disabled', true);
		}

		var textPopupContent = $this.find('.page-flip-book-ribbon span').text();
		$this.find('.page-flip-book-ribbon').prepend('<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>');
		$this.find('.page-flip-book-ribbon span').text(odrin.loading);

		var id = $(this).data('post-id');


		var readBookID = getUrlParameter('read-book');

		if (!readBookID) {
			var sPageURL = document.location.origin + document.location.pathname;
			sPageURL += '?';
			sPageURL += '&read-book=' + id;
			history.pushState({}, '', sPageURL);
		}


		$.ajax({
			type: 'post',
			dataType: 'html',
			url: odrin.ajaxurl,
			data: {
				action: '_action_odrin_ajax_bookblock_function',
				id: id
			},
			success: function (response) {
				// if ( $('.book-container-' + id).length < 1 ) {
				// ajaxSuccess(response);
				$('.book-container').remove()
				$('body').prepend(response);

				var Page = bookBlockPage();
				Page.init();
				// } else {
				// $( '.book-container' ).remove()
				// $('body').prepend(response);
				// var Page = bookBlockPage();
				// Page.init();
				// }


				$('.book-container').addClass('showBook');
				$(window).trigger('resize');


				$body.addClass('body--disabled');

				setTimeout(function () {
					$this.find('.page-flip-book-ribbon span').text(textPopupContent);
					$this.find('.page-flip-book-ribbon i').remove();

					// if a normal button was clicked
					if ($this.hasClass('btn')) {
						$this.html(btnHTML);
						$this.css('width', '');
						$this.prop('disabled', false);
					}

					$this.on('click', openFlipBook)
					$this.off('click', prevDef)

				}, 300)
			}
		});

	}

	$('.is-page-flip').on('click', openFlipBook);


	$(document).on('click', '.bb-nav-close', function (event) {
		var $this = $(this);

		var sPageURL = document.location.origin + document.location.pathname;

		history.pushState({}, '', sPageURL);

		$this.parents('.book-container').removeClass('showBook');

		$body.removeClass('body--disabled');
	})


	function autoOpenBook() {
		var readBookID = getUrlParameter('read-book');

		if (readBookID) {
			$('.is-page-flip[data-post-id="' + readBookID + '"]').trigger('click');
		}
	}

	autoOpenBook()


	/**
	* ----------------------------------------------------------------------------------------
	*    Section Centered Content
	* ----------------------------------------------------------------------------------------
	*/

	function triggerCenterContent() {

		$('.is-centered-content').each(function () {
			var $this = $(this);
			var $contentContainer = $this.find('.fw-container');
			var windowHeight = $window.height();
			var windowWidth = window.innerWidth;
			if ($contentContainer.outerHeight() <= windowHeight && windowWidth >= 768) {
				$contentContainer.addClass('el-centered');
			} else {
				if ($contentContainer.hasClass('el-centered')) {
					$contentContainer.removeClass('el-centered');
				}
			}
		})

	}

	triggerCenterContent();

	function triggerColumnAlign() {

		$('.fw-row').each(function () {
			var $this = $(this);
			var windowWidth = window.innerWidth;
			var oneForthCols = $this.children('.fw-col-sm-6');
			if (oneForthCols.length) {
				if (windowWidth >= 768 && windowWidth < 992) {
					oneForthCols.filter(':eq(0), :eq(2), :eq(4)').addClass("clear-left");
				} else {
					oneForthCols.filter(':eq(0), :eq(2), :eq(4)').removeClass("clear-left");
				}
			}
		})

	}

	triggerColumnAlign();

	$window.on('throttledresize', function () {
		triggerCenterContent();
		triggerColumnAlign();
	});

	/**
	* ----------------------------------------------------------------------------------------
	*    Section Scroll Down
	* ----------------------------------------------------------------------------------------
	*/

	$('.is-scroll-down').each(function () {

		var $this = $(this);

		$this.on('click', function (e) {
			e.preventDefault();
			var elemTop = $this.parent().offset().top;
			var height = $this.parent().outerHeight();
			var scrollBottom = height + elemTop;
			$('body,html').animate({
				scrollTop: scrollBottom,
			}, 600
			);

		})

	})

	/**
	* ----------------------------------------------------------------------------------------
	*    Nav Menu Animate Scroll To
	* ----------------------------------------------------------------------------------------
	*/

	$('.main-navigation-menu a[href*="#"]:not([href="#"])').on('click', function () {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				$('html, body').animate({
					scrollTop: target.offset().top
				}, 750);
				return false;
			}
		}
	});

	/**
	* ----------------------------------------------------------------------------------------
	*    WoW Animation on Scroll
	* ----------------------------------------------------------------------------------------
	*/

	var wow = new WOW(
		{
			boxClass: 'is-wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset: 150,          // distance to the element when triggering the animation (default is 0)
			mobile: false,       // trigger animations on mobile devices (default is true)
			live: true,       // act on asynchronously loaded content (default is true)
			callback: function (box) {
				// the callback is fired every time an animation is started
				// the argument that is passed in is the DOM node being animated
			},
			scrollContainer: null // optional scroll container selector, otherwise use window
		}
	);
	wow.init();


	/**
	* ----------------------------------------------------------------------------------------
	*    Footer Always at the Bottom
	* ----------------------------------------------------------------------------------------
	*/

	var $footerOffset = $('.footer-offset');

	function alignFooter() {
		var windowWidth = window.innerWidth;
		if ($window.height() > $footer.outerHeight() && windowWidth > 991 && !isMobile) {
			$footer.css('position', 'fixed');
			$footerOffset.css('height', $footer.outerHeight());
		} else {
			$footer.css('position', 'relative');
			$footerOffset.css('height', 0);
		}
	}

	alignFooter();

	$window.on('throttledresize', function () {
		setTimeout(function () {
			alignFooter();
		}, 20)
	});
	
})( jQuery );