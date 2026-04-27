document.addEventListener('DOMContentLoaded', () => {
    const linkCanvas = document.getElementById('linkCanvas');
    const ctx = linkCanvas.getContext('2d');
    const nodesContainer = document.getElementById('nodesContainer');
    const executionLog = document.getElementById('executionLog');
    const sidebarItems = document.querySelectorAll('.connector-item');

    // 1. Studio State
    let nodes = [];
    let connections = [];
    let pulses = [];
    let isDragging = false;
    let dragNode = null;
    let offset = { x: 0, y: 0 };

    const nodeTypes = {
        stripe: { 
            name: "Stripe Event", 
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.911 8.067c0-1.23-.801-1.902-1.933-1.902-1.462 0-2.352.661-2.352 1.942 0 1.25.922 1.782 2.112 2.202 1.352.481 2.803.961 2.803 2.843 0 1.831-1.392 2.923-3.233 2.923-1.632 0-2.823-.741-2.823-2.122h1.652c0 .88.58 1.261 1.251 1.261.941 0 1.482-.541 1.482-1.311 0-1.182-.871-1.632-1.992-2.032-1.21-.441-2.903-.981-2.903-2.933 0-1.792 1.302-2.843 3.033-2.843 1.452 0 2.502.66 2.502 1.902h-1.602z"/></svg>`, 
            color: "#635bff", desc: "Listen for new webhooks" 
        },
        shopify: { 
            name: "Shopify Order", 
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.17 6.46l-2.04-4.52s-.08-.13-.13-.19c-.06-.06-.11-.12-.18-.16-.06-.04-.14-.07-.21-.08l-.13-.01H8.72l-.13.01c-.08.01-.15.04-.21.08-.06.04-.12.1-.18.16-.05.06-.09.12-.13.19l-2.04 4.52-3.1 1.54c-.11.05-.2.13-.27.23-.07.11-.11.23-.11.35v12.28c0 .24.1.48.27.65.17.17.41.27.65.27h14.94c.24 0 .48-.1.65-.27.17-.17.27-.41.27-.65V8.58c0-.12-.04-.24-.11-.35-.07-.1-.16-.18-.27-.23l-3.1-1.54zm-6.17-2.96l1.35 3.03h-2.7l1.35-3.03z"/></svg>`, 
            color: "#95bf47", desc: "Trigger on successful sale" 
        },
        discord: { 
            name: "Discord Bot", 
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>`, 
            color: "#5865f2", desc: "Post to channel #general" 
        },
        gmail: { 
            name: "Gmail API", 
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`, 
            color: "#ea4335", desc: "Send summary email" 
        },
        slack: { 
            name: "Slack Connect", 
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.527 2.527 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.958 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.527 2.527 0 0 1-2.52 2.521h-2.522V8.834zM17.687 8.834a2.527 2.527 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.166 18.958a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.521-2.522v-2.52h2.521zM15.166 17.687a2.527 2.527 0 0 1-2.521-2.521 2.527 2.527 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.312z"/></svg>`, 
            color: "#4a154b", desc: "Ping engineering team" 
        }
    };

    // 2. Node Engine
    const createNode = (type, x, y) => {
        const id = 'node_' + Math.random().toString(36).substr(2, 9);
        const config = nodeTypes[type];
        
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.id = id;
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="icon ${type}">${config.icon}</div>
                <span>${config.name}</span>
            </div>
            <div class="node-body">${config.desc}</div>
            <div class="node-ports">
                <div class="port input" data-id="${id}" data-type="input"></div>
                <div class="port output" data-id="${id}" data-type="output"></div>
            </div>
        `;

        nodesContainer.appendChild(nodeEl);
        const node = { id, type, x, y, el: nodeEl, config };
        nodes.push(node);

        // Drag Logic
        nodeEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('port')) return;
            isDragging = true;
            dragNode = node;
            const rect = nodeEl.getBoundingClientRect();
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
            nodes.forEach(n => n.el.classList.remove('active'));
            nodeEl.classList.add('active');
        });

        // Add to Link Logic
        if (nodes.length > 1) {
            const prev = nodes[nodes.length - 2];
            connections.push({ from: prev.id, to: id });
        }

        return node;
    };

    // 3. Linker Engine (Canvas)
    const drawBezier = (x1, y1, x2, y2, active = false) => {
        ctx.beginPath();
        const cp1x = x1 + (x2 - x1) / 2;
        const cp2x = x1 + (x2 - x1) / 2;
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, y1, cp2x, y2, x2, y2);
        
        ctx.strokeStyle = active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = active ? 3 : 2;
        ctx.stroke();

        // Arrow head
        if(active) {
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(x2, y2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const render = () => {
        const wrapper = document.getElementById('nodeCanvasWrapper');
        linkCanvas.width = wrapper.clientWidth;
        linkCanvas.height = wrapper.clientHeight;
        ctx.clearRect(0, 0, linkCanvas.width, linkCanvas.height);

        connections.forEach(conn => {
            const nodeFrom = nodes.find(n => n.id === conn.from);
            const nodeTo = nodes.find(n => n.id === conn.to);
            if (nodeFrom && nodeTo) {
                const x1 = nodeFrom.x + 200;
                const y1 = nodeFrom.y + 45; // Approx center of output port
                const x2 = nodeTo.x;
                const y2 = nodeTo.y + 45; // Approx center of input port
                drawBezier(x1, y1, x2, y2, activeSync);
            }
        });

        pulses = pulses.filter(p => {
            const alive = p.update();
            if (alive) p.draw(ctx);
            return alive;
        });

        requestAnimationFrame(render);
    };

    // 4. Interaction Handlers
    document.addEventListener('mousemove', (e) => {
        if (isDragging && dragNode) {
            const x = e.clientX - offset.x - nodesContainer.getBoundingClientRect().left;
            const y = e.clientY - offset.y - nodesContainer.getBoundingClientRect().top;
            dragNode.x = x;
            dragNode.y = y;
            dragNode.el.style.left = `${x}px`;
            dragNode.el.style.top = `${y}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        dragNode = null;
    });

    // Sidebar Click Spawning
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const type = item.getAttribute('data-node-type');
            if (nodeTypes[type]) {
                createNode(type, 150 + Math.random() * 100, 150 + Math.random() * 100);
                addLog(`Orchestrator: Initialized ${type.toUpperCase()} node`, 'system');
            }
        });
    });

    // 5. Sync Simulation
    let activeSync = false;
    class SyncPulse {
        constructor(x1, y1, x2, y2) {
            this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
            this.progress = 0;
            this.cp1x = x1 + (x2 - x1) / 2;
            this.cp2x = x1 + (x2 - x1) / 2;
        }
        update() {
            this.progress += 0.015;
            return this.progress < 1;
        }
        draw(ctx) {
            const t = this.progress;
            const cx = (1 - t) ** 3 * this.x1 + 3 * (1 - t) ** 2 * t * this.cp1x + 3 * (1 - t) * t ** 2 * this.cp2x + t ** 3 * this.x2;
            const cy = (1 - t) ** 3 * this.y1 + 3 * (1 - t) ** 2 * t * this.y1 + 3 * (1 - t) * t ** 2 * this.y2 + t ** 3 * this.y2;
            
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#8b5cf6';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const addLog = (msg, type = 'sync') => {
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        item.innerText = ` > [${new Date().toLocaleTimeString('en-GB')}] ${msg}`;
        executionLog.prepend(item);
        if (executionLog.children.length > 5) executionLog.lastChild.remove();
    };

    const triggerSync = () => {
        if (nodes.length < 2) return;
        activeSync = true;
        addLog('TRIGGER: New event detected in Stripe', 'system');
        
        connections.forEach(conn => {
            const nodeFrom = nodes.find(n => n.id === conn.from);
            const nodeTo = nodes.find(n => n.id === conn.to);
            if(nodeFrom && nodeTo) {
                pulses.push(new SyncPulse(nodeFrom.x + 200, nodeFrom.y + 45, nodeTo.x, nodeTo.y + 45));
                setTimeout(() => {
                    addLog(`SYNC: Handshake verified with ${nodeTo.config.name}`, 'sync');
                }, 800);
            }
        });

        setTimeout(() => activeSync = false, 2000);
    };

    setInterval(triggerSync, 5000);

    // Initial Layout
    createNode('stripe', 100, 150);
    createNode('discord', 450, 150);
    
    requestAnimationFrame(render);
});
