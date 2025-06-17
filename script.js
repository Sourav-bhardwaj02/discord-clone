// Discord Clone JavaScript
let currentChannel = "general";
let currentUser = "";
let currentServer = "main";
let editingMessageId = null;
let typingTimeout = null;

// Data structure for storing messages
const servers = {
    main: {
        name: "My Discord Server",
        channels: {
            general: {
                name: "general",
                type: "text",
                topic: "Welcome to the general channel! Chat with everyone here.",
                messages: []
            },
            random: {
                name: "random",
                type: "text", 
                topic: "Random conversations and off-topic discussions",
                messages: []
            },
            memes: {
                name: "memes",
                type: "text",
                topic: "Share your best memes here!",
                messages: []
            },
            "general-voice": {
                name: "General",
                type: "voice",
                members: []
            },
            "music-room": {
                name: "Music Room", 
                type: "voice",
                members: []
            }
        }
    },
    gaming: {
        name: "Gaming Hub",
        channels: {
            "game-chat": {
                name: "game-chat",
                type: "text",
                topic: "Discuss your favorite games",
                messages: []
            }
        }
    },
    music: {
        name: "Music Lounge",
        channels: {
            "music-general": {
                name: "music-general", 
                type: "text",
                topic: "Share and discuss music",
                messages: []
            }
        }
    }
};

// Online users simulation
let onlineUsers = [];

// DOM Elements
const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const channelTitle = document.getElementById("currentChannelName");
const displayUsername = document.getElementById("displayUsername");
const userAvatar = document.getElementById("userAvatar");
const memberAvatar = document.getElementById("memberAvatar");
const memberName = document.getElementById("memberName");
const onlineCount = document.getElementById("onlineCount");
const contextMenu = document.getElementById("contextMenu");
const memberList = document.getElementById("memberList");
const memberListToggle = document.getElementById("memberListToggle");
const typingIndicator = document.getElementById("typingIndicator");

// Event Listeners
document.addEventListener("DOMContentLoaded", initializeApp);
messageInput.addEventListener("keypress", handleKeyPress);
messageInput.addEventListener("input", handleTyping);
memberListToggle.addEventListener("click", toggleMemberList);

// Click outside to close context menu
document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) {
        hideContextMenu();
    }
});

// Right click on messages for context menu
document.addEventListener("contextmenu", handleRightClick);

// Server switching
document.querySelectorAll(".server-icon").forEach(icon => {
    icon.addEventListener("click", (e) => {
        if (!e.target.classList.contains("add-server")) {
            switchServer(e.target.dataset.server);
        }
    });
});

// Channel switching
document.addEventListener("click", (e) => {
    if (e.target.closest(".channel-item")) {
        const channelItem = e.target.closest(".channel-item");
        const channelName = channelItem.dataset.channel;
        const channelType = channelItem.dataset.type;
        
        if (channelType === "text") {
            switchChannel(channelName);
        }
    }
});

// Initialize the application
function initializeApp() {
    // Show username modal on load
    showUsernameModal();
    
    // Add some demo messages
    addDemoMessages();
    
    // Set up periodic "user activity" simulation
    setInterval(simulateUserActivity, 30000); // Every 30 seconds
}

function showUsernameModal() {
    const modal = document.getElementById("usernameModal");
    modal.style.display = "flex";
    
    // Focus on input
    const input = document.getElementById("usernameInput");
    setTimeout(() => input.focus(), 100);
}

function setUsername() {
    const input = document.getElementById("usernameInput");
    const error = document.getElementById("usernameError");
    const username = input.value.trim();
    
    // Validation
    if (username === "") {
        showError(error, "Username cannot be empty");
        return;
    }
    
    if (username.length < 2) {
        showError(error, "Username must be at least 2 characters");
        return;
    }
    
    if (username.length > 20) {
        showError(error, "Username cannot exceed 20 characters");
        return;
    }
    
    // Set user data
    currentUser = username;
    document.getElementById("usernameModal").style.display = "none";
    
    // Update UI
    displayUsername.textContent = currentUser;
    userAvatar.textContent = getInitials(currentUser);
    memberName.textContent = currentUser;
    memberAvatar.textContent = getInitials(currentUser);
    
    // Add user to online list
    onlineUsers.push({
        name: currentUser,
        avatar: getInitials(currentUser),
        status: "online",
        activity: "Playing Discord Clone"
    });
    
    updateOnlineCount();
    loadMessages(currentChannel);
    
    // Send welcome message
    setTimeout(() => {
        addSystemMessage("Welcome to the server, " + currentUser + "! 👋");
    }, 1000);
}

function showError(errorEl, message) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
    setTimeout(() => {
        errorEl.style.display = "none";
    }, 3000);
}

function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        
        if (editingMessageId) {
            saveEditedMessage();
        } else {
            sendMessage();
        }
    }
    
    if (e.key === "Escape" && editingMessageId) {
        cancelEdit();
    }
}

function handleTyping() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    if (messageInput.value.trim() !== "") {
        showTypingIndicator();
        
        typingTimeout = setTimeout(() => {
            hideTypingIndicator();
        }, 2000);
    } else {
        hideTypingIndicator();
    }
}

function showTypingIndicator() {
    typingIndicator.textContent = `${currentUser} is typing...`;
}

function hideTypingIndicator() {
    typingIndicator.textContent = "";
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text === "" || currentUser === "") return;
    
    const message = {
        id: Date.now(),
        user: currentUser,
        text: text,
        timestamp: new Date(),
        edited: false
    };
    
    // Add message to current channel
    servers[currentServer].channels[currentChannel].messages.push(message);
    
    // Clear input and update display
    messageInput.value = "";
    hideTypingIndicator();
    loadMessages(currentChannel);
    
    // Simulate response from other users occasionally
    if (Math.random() < 0.3) {
        setTimeout(() => {
            simulateResponse(text);
        }, 1000 + Math.random() * 3000);
    }
}

function loadMessages(channelName) {
    const channel = servers[currentServer].channels[channelName];
    if (!channel) return;
    
    messagesEl.innerHTML = "";
    
    // Show welcome message for empty channels
    if (channel.messages.length === 0) {
        showWelcomeMessage(channelName);
        return;
    }
    
    // Display messages
    channel.messages.forEach(message => {
        displayMessage(message);
    });
    
    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    // Update channel info
    updateChannelInfo(channelName);
}

function displayMessage(message) {
    const messageEl = document.createElement("div");
    messageEl.className = "message";
    messageEl.dataset.messageId = message.id;
    
    const avatarColor = getAvatarColor(message.user);
    
    messageEl.innerHTML = `
        <div class="message-avatar" style="background: ${avatarColor}">
            ${getInitials(message.user)}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${message.user}</span>
                <span class="message-timestamp">${formatTimestamp(message.timestamp)}</span>
                ${message.edited ? '<span class="edited-indicator">(edited)</span>' : ''}
            </div>
            <div class="message-text">${formatMessageText(message.text)}</div>
        </div>
        ${message.user === currentUser ? `
            <div class="message-actions">
                <button class="message-action-btn" onclick="startEdit(${message.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="message-action-btn delete" onclick="deleteMessage(${message.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : ''}
    `;
    
    messagesEl.appendChild(messageEl);
}

function showWelcomeMessage(channelName) {
    const welcomeEl = document.createElement("div");
    welcomeEl.className = "welcome-message";
    welcomeEl.innerHTML = `
        <div class="welcome-icon">
            <i class="fas fa-hashtag"></i>
        </div>
        <h3>Welcome to #${channelName}!</h3>
        <p>This is the start of the #${channelName} channel.</p>
    `;
    messagesEl.appendChild(welcomeEl);
}

function formatTimestamp(date) {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If today, show time only
    if (now.toDateString() === messageDate.toDateString()) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday at time"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === messageDate.toDateString()) {
        return `Yesterday at ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date and time
    return messageDate.toLocaleDateString() + " " + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMessageText(text) {
    // Simple formatting for mentions, links, etc.
    return text
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
        .replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

function getAvatarColor(username) {
    const colors = [
        "linear-gradient(135deg, #ff6b6b, #ffd93d)",
        "linear-gradient(135deg, #6bcf7f, #4ecdc4)", 
        "linear-gradient(135deg, #4ecdc4, #44a08d)",
        "linear-gradient(135deg, #a8edea, #fed6e3)",
        "linear-gradient(135deg, #ffecd2, #fcb69f)",
        "linear-gradient(135deg, #ff8a80, #ff5722)",
        "linear-gradient(135deg, #ce93d8, #9c27b0)",
        "linear-gradient(135deg, #90caf9, #2196f3)"
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

function switchChannel(channelName) {
    // Update active channel
    document.querySelectorAll(".channel-item").forEach(item => {
        item.classList.remove("active");
    });
    
    document.querySelector(`[data-channel="${channelName}"]`).classList.add("active");
    
    currentChannel = channelName;
    loadMessages(channelName);
}

function updateChannelInfo(channelName) {
    const channel = servers[currentServer].channels[channelName];
    channelTitle.textContent = channelName;
    
    // Update header
    document.getElementById("currentChannelName").textContent = channelName;
    document.querySelector(".channel-topic").textContent = channel.topic || "";
    
    // Update input placeholder
    messageInput.placeholder = `Message #${channelName}`;
    
    // Update welcome message channel names
    const welcomeNames = document.querySelectorAll("#welcomeChannelName, #welcomeChannelName2");
    welcomeNames.forEach(el => {
        if (el) el.textContent = channelName;
    });
}

function switchServer(serverName) {
    if (!servers[serverName]) return;
    
    // Update active server
    document.querySelectorAll(".server-icon").forEach(icon => {
        icon.classList.remove("active");
    });
    
    document.querySelector(`[data-server="${serverName}"]`).classList.add("active");
    
    currentServer = serverName;
    
    // Update server name
    document.getElementById("serverName").textContent = servers[serverName].name;
    
    // Load first text channel
    const firstTextChannel = Object.keys(servers[serverName].channels)
        .find(key => servers[serverName].channels[key].type === "text");
    
    if (firstTextChannel) {
        currentChannel = firstTextChannel;
        updateChannelList();
        loadMessages(firstTextChannel);
    }
}

function updateChannelList() {
    const textChannelList = document.getElementById("textChannelList");
    const voiceChannelList = document.getElementById("voiceChannelList");
    
    // Clear existing channels
    textChannelList.innerHTML = "";
    voiceChannelList.innerHTML = "";
    
    // Add channels for current server
    Object.entries(servers[currentServer].channels).forEach(([key, channel]) => {
        const li = document.createElement("li");
        li.className = "channel-item";
        li.dataset.channel = key;
        li.dataset.type = channel.type;
        
        if (key === currentChannel) {
            li.classList.add("active");
        }
        
        const icon = channel.type === "text" ? "fas fa-hashtag" : "fas fa-volume-up";
        
        li.innerHTML = `
            <i class="${icon}"></i>
            <span>${channel.name}</span>
            <div class="channel-actions">
                <button class="channel-action-btn" onclick="deleteChannel('${key}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        if (channel.type === "text") {
            textChannelList.appendChild(li);
        } else {
            voiceChannelList.appendChild(li);
        }
    });
}

function addChannel(type) {
    const name = prompt(`Enter ${type} channel name:`);
    if (!name || name.trim() === "") return;
    
    const channelKey = name.toLowerCase().replace(/\s+/g, "-");
    
    // Check if channel already exists
    if (servers[currentServer].channels[channelKey]) {
        alert("Channel already exists!");
        return;
    }
    
    // Add new channel
    servers[currentServer].channels[channelKey] = {
        name: name,
        type: type,
        topic: type === "text" ? `Welcome to #${name}!` : "",
        messages: type === "text" ? [] : undefined,
        members: type === "voice" ? [] : undefined
    };
    
    updateChannelList();
    
    if (type === "text") {
        switchChannel(channelKey);
    }
}

function deleteChannel(channelKey) {
    if (Object.keys(servers[currentServer].channels).length <= 1) {
        alert("Cannot delete the last channel!");
        return;
    }
    
    if (confirm(`Are you sure you want to delete #${servers[currentServer].channels[channelKey].name}?`)) {
        delete servers[currentServer].channels[channelKey];
        
        // Switch to first available channel if current was deleted
        if (currentChannel === channelKey) {
            const firstChannel = Object.keys(servers[currentServer].channels)
                .find(key => servers[currentServer].channels[key].type === "text");
            if (firstChannel) {
                currentChannel = firstChannel;
            }
        }
        
        updateChannelList();
        loadMessages(currentChannel);
    }
}

function startEdit(messageId) {
    const message = servers[currentServer].channels[currentChannel].messages
        .find(m => m.id === messageId);
    
    if (!message || message.user !== currentUser) return;
    
    editingMessageId = messageId;
    
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const textEl = messageEl.querySelector(".message-text");
    
    // Replace text with input
    textEl.innerHTML = `
        <textarea class="edit-input" rows="1">${message.text}</textarea>
        <div class="edit-actions">
            <button class="edit-btn-save" onclick="saveEditedMessage()">Save</button>
            <button class="edit-btn-cancel" onclick="cancelEdit()">Cancel</button>
        </div>
    `;
    
    const textarea = textEl.querySelector(".edit-input");
    textarea.focus();
    textarea.select();
    
    // Auto-resize textarea
    textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    });
    
    messageEl.classList.add("editing");
}

function saveEditedMessage() {
    if (!editingMessageId) return;
    
    const messageEl = document.querySelector(`[data-message-id="${editingMessageId}"]`);
    const textarea = messageEl.querySelector(".edit-input");
    const newText = textarea.value.trim();
    
    if (newText === "") {
        cancelEdit();
        return;
    }
    
    // Update message
    const message = servers[currentServer].channels[currentChannel].messages
        .find(m => m.id === editingMessageId);
    
    message.text = newText;
    message.edited = true;
    
    editingMessageId = null;
    loadMessages(currentChannel);
}

function cancelEdit() {
    editingMessageId = null;
    loadMessages(currentChannel);
}

function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
        servers[currentServer].channels[currentChannel].messages = 
            servers[currentServer].channels[currentChannel].messages
                .filter(m => m.id !== messageId);
        
        loadMessages(currentChannel);
    }
}

function handleRightClick(e) {
    const messageEl = e.target.closest(".message");
    if (messageEl && messageEl.dataset.messageId) {
        e.preventDefault();
        
        const messageId = parseInt(messageEl.dataset.messageId);
        const message = servers[currentServer].channels[currentChannel].messages
            .find(m => m.id === messageId);
        
        if (message && message.user === currentUser) {
            showContextMenu(e.clientX, e.clientY, messageId);
        }
    }
}

function showContextMenu(x, y, messageId) {
    contextMenu.dataset.messageId = messageId;
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.style.display = "block";
    
    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (x - rect.width) + "px";
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (y - rect.height) + "px";
    }
}

