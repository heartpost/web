<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { createClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let showBox = false;
	let showText = false;
	let showTextarea = false;
	let loading = true;

	let email = '';
	let password = '';
	let message = '';
	let error = '';
	let loggedIn = false;

	let messageInput: HTMLTextAreaElement;

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	onMount(() => {
		// preloading
		setTimeout(() => {
			loading = false;

			//blocking potential risks by storing credential data in localstorage :)

			if (localStorage.getItem('blocked')) {
				error = 'Access from your internet protocol has been temporarily limited for security reasons.';
				return;
			}

			showBox = true;
			setTimeout(() => {
				showText = true;
				setTimeout(() => {
					showTextarea = true;
					messageInput?.focus();
				}, 300);
			}, 400);
		}, 1000);

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session) loggedIn = true;
		});
	});

	async function login(): Promise<void> {
		if (localStorage.getItem('blocked')) {
			error = 'Access from internet protocol has been temporarily limited for security reasons.';
			return;
		}

		const { error: err } = await supabase.auth.signInWithPassword({ email, password });

		if (err) {
			console.error('Login error:', err);
			error = 'Invalid credentials.';

			let attempts = parseInt(localStorage.getItem('attempts') || '0');
			attempts += 1;
			localStorage.setItem('attempts', attempts.toString());

			if (attempts >= 3) {
				localStorage.setItem('blocked', 'true');
				error = 'Access from internet protocol has been temporarily limited for security reasons.';
				localStorage.removeItem('attempts');
			}

			return;
		}

		localStorage.removeItem('attempts');
		localStorage.removeItem('blocked');
		loggedIn = true;
		error = '';
	}

	async function sendMessage(): Promise<void> {
		if (!message) return;

		const { data, error: err } = await supabase
			.from('mail')
			.insert([{ msg: message, seen: false }]);

		if (err) {
			console.error('Insert error:', err);
			return;
		}

		console.log('Message sent:', data);
		message = '';
		messageInput.focus();
		alert('Message sent!');
	}
</script>

{#if loading}
	<div class="centered">
		<div class="loader"></div>
	</div>
{:else if localStorage.getItem('blocked')}
	<div class="centered">
		{error}
	</div>
{:else}
	<main>
		<div class="flex items-start justify-start p-12 text-white">
			<div class="max-w-lg space-y-6 text-[20px]">
				{#if showBox}
					<div class="h-6 w-6 bg-orange-600" in:scale={{ duration: 400 }}></div>
				{/if}

				{#if !loggedIn}
					<div>
						<input
							type="email"
							bind:value={email}
							placeholder="Email"
							class="space-y-2 border border-[#5C5C5C] px-4 py-1 text-sm text-white transition-colors duration-300 hover:border-blue-500 hover:text-blue-500"
						/>
						<input
							type="password"
							bind:value={password}
							placeholder="Password"
							class="space-y-2 border border-[#5C5C5C] px-4 py-1 text-sm text-white transition-colors duration-300 hover:border-blue-500 hover:text-blue-500"
						/>
						<button
							on:click={login}
							class="border border-[#5C5C5C] px-4 py-1 text-sm text-white transition-colors duration-300 hover:border-blue-500 hover:text-blue-500"
						>
							Login
						</button>
						{#if error}
							<p class="my-1 text-sm text-red-500">{error}</p>
						{/if}
					</div>
				{:else if showTextarea}
					<div in:fade={{ duration: 400 }} class="space-y-2">
						<textarea
							bind:this={messageInput}
							bind:value={message}
							maxlength="15"
							placeholder="Write your message"
							class="w-full resize-none rounded border border-[#5C5C5C] p-2 text-white"
							on:input={() => (message = message.slice(0, 15))}
						></textarea>
						<button
							on:click={sendMessage}
							class="border border-[#5C5C5C] px-4 py-1 text-sm text-white transition-colors duration-300 hover:border-blue-500 hover:text-blue-500"
						>
							Send
						</button>
					</div>
				{/if}
			</div>
		</div>
	</main>
{/if}

<style>
	.centered {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		text-align: center;
		color: white;
		font-size: 24px;
	}

	.loader {
		border: 4px solid #1d0c00;
		border-top: 4px solid #ff6600;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin-bottom: 10px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
