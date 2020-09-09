var joined = false;
var typing = false;

function hideTyping() {
	if (typing) {
		$('#participants small').addClass('d-none');
	}
	typing = false;
}

function alertChannel(alertTxt){
	var alert = `<div class="alert alert-primary" role="alert">${alertTxt}</div>`;
	$('#chat').append(alert);
}

function addMsg(msgData){
	var msg = `
		<div class="message ${msgData.direction}" data-time="${msgData.time}">
			<div class="user">
				<img src="${msgData.user.image}" alt="Image">
				<p>${msgData.user.name}</p>
			</div>
			<p>${msgData.msg}</p>
			<small class="text-muted time">Just now</small>
		</div>
	`;
	$('#chat').append(msg);
}

function timeSince(timestamp) {
	var date = new Date();
	var timenow = date.getTime();
	var milliseconds = Math.floor(timenow - timestamp);
	var minutes = milliseconds / 60000;
	if (minutes > 60) {
		return Math.floor(minutes/60) + " hour(s) ago.";
	} else if (minutes > 2) {
		return Math.floor(minutes) + " minutes ago.";
	} else {
		return "Just now."
	}
}

function updateTime() {
	$('#chat .alert').remove();
	$('.message').each(function() {
		var time = $(this).data('time');
		$(this).find('.time').html(timeSince(time));  
	});      
}

$(document).ready(function(){

	var msgBox = $("#message-box");
	var timeoutTyping;

	if (msgBox.length) {

		updateTime();

		var user = $('#chat-info').data('user');
		var channel = $('#chat-info').data('channel');

	 	var socket = io.connect('http://localhost:3000');
		socket.on('connect', function() {
			if (!joined) {
				var msgTxt = `Welcome to ${channel.name}, ${user.name }!`;
				alertChannel(msgTxt);
				socket.emit('join', {user: user, channel: channel});
				joined = true;
			}
		});

		socket.on('alert', (alertTxt) => {
			alertChannel(alertTxt);
		});

		socket.on('typing', (typist) => {
			typing = true;
			$('#user' + typist + ' small').removeClass('d-none'); 
			clearTimeout(timeoutTyping);
			timeoutTyping = setTimeout(hideTyping, 2000);
		});

		socket.on('messageIn', (msgData) => {
			addMsg(msgData);
		});

		msgBox.bind('keypress', () => {
			socket.emit('typing', {user: user, channel: channel});
		})

		$('#message-form').submit(function(event) {
			event.preventDefault();
			var date = new Date();
			var msgData = {
				user: user,
				channel: channel,
				msg: msgBox.val(),
				time: date.getTime(),
				direction: 'out',
			}
			msgBox.val('');
			addMsg(msgData);
			msgData.direction = 'in'
			socket.emit('messageOut', msgData);
		});
		
		setInterval(updateTime, 5000);
	}

});