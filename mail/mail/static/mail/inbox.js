document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

window.onpopstate = function(event) {
    this.console.log(event.state.mailbox);
    this.load_mailbox(event.state.mailbox);
    this.console.log(event.state.email_id);
    this.get_email(event.state.email_id);
}

function compose_email() {

  // show compose url
  history.pushState({}, "", "compose");

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send Mail and load user's sent mailbox 
  document.querySelector('form').onsubmit = () => {
      fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
        })
      })
      .then(response => response.json())
      .then(result => {
          if (result["error"]) {
              alert(result["error"]);
          } else if (result["message"]) {
              alert(result["message"]);
              console.log(result["message"]);
              load_mailbox('sent');
          }
      })
      .catch(error => {
          console.log('Error:', error);
      });
      event.preventDefault();
  }
};



function load_mailbox(mailbox) {

  // show mailbox url
  history.pushState({mailbox: mailbox}, "", `/emails/${mailbox}`);
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get mails when a user visits Inbox, Sent or Archive
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      if (emails.length == 0) {
          alert("No Email Available");
        //   document.querySelector('.parent').innerHTML = 'No Email Available';
      } else {
        emails.forEach(email => {
            // console.log(email);

            // add sub-div element under emails-view
            const parentElement = document.createElement('div');
            const emailElement = document.createElement('p');
            const subjectElement = document.createElement('p');
            const timeElement = document.createElement('p');

            parentElement.className = 'parent';
            emailElement.className = 'email';
            subjectElement.className = 'subject';
            timeElement.className = 'time';

            emailElement.innerHTML = `Sender: ${email["sender"]}`;
            subjectElement.innerHTML = `Subject: ${email["subject"]}`;
            timeElement.innerHTML = `Time: ${email["timestamp"]}`;


            // Add email to emails-view
            document.querySelector('#emails-view').append(parentElement);
            parentElement.appendChild(emailElement);
            parentElement.appendChild(subjectElement);
            parentElement.appendChild(timeElement);

            // Change email backgroud color
            if (email["read"]) {
                parentElement.style.backgroundColor = "grey";
            } else {
                parentElement.style.backgroundColor = "white";
            }
             
            //Click on individual email
            // document.querySelector('.parent').onclick = () => get_email(email);
            parentElement.addEventListener("click", function () {
                // console.log('This element has been clicked!');
                get_email(email);
                fetch(`/emails/${email["id"]}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true
                    })
            });
    });

        });
      };
  })
  .catch(error => {
      console.log('Error:', error);
  });
  };

// Get individual email
function get_email(email){
    // show mailbox url
    history.pushState({email: email}, "", `/emails/${email["id"]}`);
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#detail-view').style.display = 'block';

    fetch(`/emails/${email["id"]}`)
    .then(response => response.json())
    .then (email => {
        console.log(email["subject"]);

        document.querySelector('.email-sender').innerHTML = `Sender: ${email["sender"]}`;
        document.querySelector('.email-recipient').innerHTML = `Recipients: ${email["recipients"]}`;
        document.querySelector('.email-subject').innerHTML = `Subject: ${email["subject"]}`;
        document.querySelector('.email-time').innerHTML = `Timestamp: ${email["timestamp"]}`;
        if (email["archived"]) {
            document.querySelector('#archive').innerHTML = "Unarchive";

        } else {
            document.querySelector('#archive').innerHTML = "Archive";
        };
        document.querySelector('.email-body').innerHTML = email["body"];
        console.log(email["body"]);
    });

    // Toggle archive button
    // document.querySelector('#archive').addEventListener("click", () => {
    //     archive(email);
    //     load_mailbox('inbox');
    //     event.preventDefault();
    //     console.log(email);
    // });

    document.querySelector('#archive').onclick = () => {
        archive(email);
        load_mailbox('inbox');
        event.preventDefault();
        console.log(email);
    }

    // Reply email
    // document.querySelector('#reply').addEventListener("click", () => {
    //     reply(email);
    // });
    document.querySelector('#reply').onclick = () => {
        reply(email);
    };
};

function archive(email) {
    fetch(`/emails/${email["id"]}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email["archived"]
        })
    });

};

function reply(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#detail-view').style.display = 'none';

    document.querySelector('#compose-title').innerHTML = "Reply Email";
    document.querySelector('#compose-body').placeholder = `On ${email["timestamp"]} ${email["sender"]} wrote:\n${email["body"]}\n------------\n`;

      // Clear out composition fields
    document.querySelector('#compose-recipients').value = email["sender"];
    document.querySelector('#compose-subject').value = email["subject"].startsWith("Re") ? `${email["subject"]}` : `Re:${email["subject"]}`;
    document.querySelector('#compose-body').value = `On ${email["timestamp"]} ${email["sender"]} wrote:\n${email["body"]}\n------------\n`;
    console.log(email["timestamp"]);

    // Send Mail and load user's sent mailbox 
    document.querySelector('form').onsubmit = () => {
        fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
            })
        })
        .then(response => response.json())
        .then(result => {
          if (result["error"]) {
              alert(result["error"]);
              console.log(result);
          } else if (result["message"]) {
              alert(result["message"]);
              console.log(result["message"]);
              load_mailbox('sent');
          }
      })
        .catch(error => {
            console.log('Error:', error);
        });
        event.preventDefault();
    }

}