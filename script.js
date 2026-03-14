const myemail = "kobiew06@outlook.com"

let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    const name = document.querySelector('input[placeholder="Name"]').value;
    const email = document.querySelector('input[placeholder="Email"]').value;
    const phone = document.querySelector('input[placeholder="Phone"]').value;
    const subject = document.querySelector('input[placeholder="Subject"]').value;
    const message = document.querySelector('textarea[placeholder="Message"]').value;
    const mailtoLink = `mailto:${myemail}?subject=Contact%20Kobie&body=Hi%20Kobie,%0D%0A%0D%0AName:%20${name}%0D%0AEmail:%20${email}%0D%0APhone:%20${phone}%0D%0ASubject:%20${subject}%0D%0AMessage:%20${message}`;
    window.location.href = mailtoLink;
});