import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from "gsap"


/* Events */
const repoBtn = document.getElementById('repo-btn');
repoBtn.addEventListener('click', () => {
    location.href = 'https://github.com/sebas2906/ai-agent-core'
});


/**
 * 8-bit typing (per-letter, wrap-friendly)
 */

const typingEl = document.querySelector('.typing-text')
if (typingEl) {
    const fullText = typingEl.textContent.trim().replace(/\s+/g, ' ')
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (prefersReducedMotion) {
        typingEl.textContent = fullText
    }
    else {
        typingEl.textContent = ''

        const startDelayMs = 500
        const charDelayMs = 40

        const chars = Array.from(fullText)
        let i = 0

        const typeNext = () => {
            typingEl.textContent = chars.slice(0, i).join('')
            i++
            if (i <= chars.length)
                window.setTimeout(typeNext, charDelayMs)
        }

        window.setTimeout(typeNext, startDelayMs)
    }
}

/**
 * Contact chat (POST http://localhost:3001/chat)
 * Body: { query: string, id?: string }
 * First request: id is absent (undefined)
 * Next requests: id comes from response + localStorage
 */
{
    const CHAT_ID_KEY = 'portfolio_chat_id'
    const chatMessagesEl = document.getElementById('chatMessages')
    const chatForm = document.getElementById('chatForm')
    const chatInput = document.getElementById('chatInput')
    const chatSend = document.getElementById('chatSend')
    const chatStatus = document.getElementById('chatStatus')

    if (chatMessagesEl && chatForm && chatInput && chatSend && chatStatus) {
        const appendMessage = (role, text) => {
            const msg = document.createElement('div')
            msg.className = `chat-message ${role}`
            msg.textContent = text
            chatMessagesEl.appendChild(msg)
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
        }

        const setStatus = (text) => {
            chatStatus.textContent = text
        }

        const extractId = (data) => {
            if (!data || typeof data !== 'object') return undefined
            return data.threadId
        }

        const extractAnswer = (data) => {
            if (typeof data === 'string') return data
            if (!data || typeof data !== 'object') return ''
            return data.answer || data.response || data.message || data.output || ''
        }

        const sendQuery = async (query) => {
            const savedId = localStorage.getItem(CHAT_ID_KEY) || undefined
            const captcha = await getCaptcha();
            const body = {
                query,
                'g-recaptcha-response': captcha
            }
            if (savedId) body.id = savedId

            const res = await fetch('https://public.stechmobile.com/agent-core/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const errorText = await res.text().catch(() => '')
                throw new Error(`Chat API error ${res.status}: ${errorText || res.statusText}`)
            }

            const data = await res.json().catch(async () => ({ message: await res.text().catch(() => '') }))

            const nextId = extractId(data)
            if (nextId)
                localStorage.setItem(CHAT_ID_KEY, String(nextId))

            return extractAnswer(data)
        }

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const query = String(chatInput.value || '').trim()
            if (!query) return

            appendMessage('user', query)
            chatInput.value = ''
            chatInput.focus()

            chatSend.disabled = true
            chatInput.disabled = true
            setStatus('Thinking...')

            try {
                const answer = await sendQuery(query)
                appendMessage('assistant', answer || 'No response received.')
                setStatus('')
            }
            catch (err) {
                appendMessage('assistant', `Error: ${err?.message || String(err)}`)
                setStatus('Make sure the API is running on http://localhost:3001 and CORS is enabled.')
            }
            finally {
                chatSend.disabled = false
                chatInput.disabled = false
            }
        })
    }
}


/**
 * Debug
 */
/* const gui = new GUI() */

const parameters = {
    materialColor: '#3c98fb'
}

/* gui.addColor(parameters, 'materialColor').onChange(() => {
    material.color.set(parameters.materialColor);
    particlesMaterial.color.set(parameters.materialColor);
}); */

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * texture
 */

const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load('textures/gradients/3.jpg');
gradientTexture.magFilter = THREE.NearestFilter;

/**
 * Objects
 */
const material = new THREE.MeshToonMaterial(
    {
        color: parameters.materialColor,
        gradientMap: gradientTexture
    }
);

const objectsDistance = 4;

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
);

const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
);

const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
);

mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

/**
 * Particles
 */
const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    sizeAttenuation: true,
    size: 0.03
});

//Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Lights
 */

const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const cameraGroup = new THREE.Group();
scene.add(cameraGroup)
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY;
let currentSession = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    const newSection = Math.round(scrollY / sizes.height);
    if (newSection != currentSession) {
        currentSession = newSection;
        gsap.to(sectionMeshes[currentSession].rotation, {
            duration: 1.5,
            ease: 'power2.inOut',
            x: '+=6',
            y: '+=3',
            z: '+=1.5'
        });
    }
});

/**
 * Cursor
 */

const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5;
    cursor.y = event.clientY / sizes.height - 0.5;
});

/* Captcha */
function getCaptcha() {
    return new Promise((resolve, reject) => {
        grecaptcha.ready(function () {
            grecaptcha.execute('6LfladQrAAAAAFXXy77glfBU8wChqxagk1ipQGM5', { action: 'submit' }).then(function (token) {
                resolve(token)
            });
        });
    });
}


/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;


const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    //Animate Camera
    camera.position.y = -scrollY / sizes.height * objectsDistance;
    const paralaxX = cursor.x * 0.5;
    const paralaxY = -cursor.y * 0.5;
    cameraGroup.position.x += (paralaxX - cameraGroup.position.x) * 5 * deltaTime;
    cameraGroup.position.y += (paralaxY - cameraGroup.position.y) * 5 * deltaTime;
    //Animate meshes
    sectionMeshes.forEach(mesh => {
        mesh.rotation.x += deltaTime * 0.1;
        mesh.rotation.y += deltaTime * 0.12;
    });
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()