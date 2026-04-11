document.addEventListener('DOMContentLoaded', () => {
    
    // 0. CURTAIN LOGIC
    document.body.classList.add('curtain-active');
    document.documentElement.classList.add('curtain-active'); // Initially disable scroll
    const curtainBtn = document.getElementById('openCurtainBtn');
    const curtain = document.getElementById('curtain');
    
    if (curtainBtn && curtain) {
        curtainBtn.addEventListener('click', () => {
            curtain.classList.add('open');
            
            // Play background music
            const bgMusic = document.getElementById('bgMusic');
            const musicToggle = document.getElementById('musicToggle');
            
            if (bgMusic) {
                bgMusic.currentTime = 13; // Start from 13th second
                bgMusic.play().then(() => {
                    if (musicToggle) {
                        musicToggle.classList.add('visible', 'playing');
                    }
                }).catch(e => {
                    console.log("Audio play blocked/failed:", e);
                    if (musicToggle) {
                        musicToggle.classList.add('visible');
                    }
                });
            }

            // Re-enable scroll when animation finishes
            setTimeout(() => {
                document.body.classList.remove('curtain-active');
                document.documentElement.classList.remove('curtain-active');
            }, 1500);
        });
    }

    // 0.1 MUSIC TOGGLE LOGIC
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    
    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                musicToggle.classList.add('playing');
            } else {
                bgMusic.pause();
                musicToggle.classList.remove('playing');
            }
        });

        // Sync state if controlled externally (e.g. system media controls)
        bgMusic.addEventListener('play', () => musicToggle.classList.add('playing'));
        bgMusic.addEventListener('pause', () => musicToggle.classList.remove('playing'));
    }

    // 1. INTERSECTION OBSERVER FOR SCROLL ANIMATIONS (REVEAL EFFECT)
    const revealElements = document.querySelectorAll('.reveal');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    };

    const revealOptions = {
        threshold: 0.15, // Trigger when 15% of the item is visible
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 2. COUNTDOWN TIMER LOGIC
    // Set wedding date (Format: Year, Month (0-indexed), Day, Hour, Min, Sec)
    // For example, 25 October 2026 19:00 -> Month is 9
    const weddingDate = new Date(2026, 9, 25, 19, 0, 0).getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            // Wedding has passed
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update DOM with leading zeros
        daysEl.innerText = days < 10 ? '0' + days : days;
        hoursEl.innerText = hours < 10 ? '0' + hours : hours;
        minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
        secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    };

    // Update countdown every 1 second
    setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    // 3. ADD TO CALENDAR LOGIC (.ics generation)
    const addToCalendarBtn = document.getElementById('addToCalendar');
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const eventTitle = "Fərid & Aysel Toy Mərasimi";
            const location = "Quba Şadlıq Sarayı, Quba, Azərbaycan";
            const description = "Ən xoşbəxt günümüzdə sizi də aramızda görməkdən şərəf duyarıq.";
            
            // Format dates (YYYYMMDDTHHMMSS)
            // Oct 25 2026, 19:00 - 23:00
            const startDate = "20261025T190000";
            const endDate = "20261025T230000";
            
            const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FaridAysel//Wedding//AZ\nBEGIN:VEVENT\nUID:${new Date().getTime()}@wedding.int\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDTSTART:${startDate}\nDTEND:${endDate}\nSUMMARY:${eventTitle}\nDESCRIPTION:${description}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', 'ferid_aysel_toy.ics');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // 4. GUESTBOOK LOGIC (LocalStorage)
    const guestbookForm = document.getElementById('guestbook-form');
    const messagesContainer = document.getElementById('messages-container');

    // Load messages from LocalStorage
    const loadMessages = () => {
        if(!messagesContainer) return;
        const messages = JSON.parse(localStorage.getItem('weddingMessages')) || [];
        messagesContainer.innerHTML = ''; // Clear container

        if(messages.length === 0) {
            messagesContainer.innerHTML = '<p style="text-align:center; opacity:0.6;">Hələ ki mesaj yoxdur. İlk mesajı siz yazın!</p>';
            return;
        }

        // Render from newest to oldest
        const sortedMessages = [...messages].reverse();
        sortedMessages.forEach(msg => {
            const dateStr = new Date(msg.timestamp).toLocaleDateString('az-AZ');
            // Basic sanitization
            const safeName = msg.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeSurname = msg.surname.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const html = `
                <div class="message-card">
                    <div class="message-card-header">
                        <span class="message-card-name">${safeName} ${safeSurname}</span>
                        <span class="message-card-date">${dateStr}</span>
                    </div>
                    <div class="message-card-text">
                        ${safeText}
                    </div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', html);
        });
    };

    if (guestbookForm && messagesContainer) {
        loadMessages(); // Load on init

        guestbookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('gb-name').value.trim();
            const surnameInput = document.getElementById('gb-surname').value.trim();
            const messageInput = document.getElementById('gb-message').value.trim();

            if (!nameInput || !surnameInput || !messageInput) return;

            const newMessage = {
                id: Date.now(),
                name: nameInput,
                surname: surnameInput,
                text: messageInput.replace(/\\n/g, "<br>"),
                timestamp: new Date().toISOString()
            };

            const messages = JSON.parse(localStorage.getItem('weddingMessages')) || [];
            messages.push(newMessage);
            localStorage.setItem('weddingMessages', JSON.stringify(messages));

            guestbookForm.reset();
            
            alert("Təbrik mesajınız üçün təşəkkür edirik!");
            loadMessages();
        });
    }

});
