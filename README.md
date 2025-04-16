# Coding Buddy, your AI coding companion!

Coding Buddy is a VSCode extension that uses OpenAI's API in order to give you recommendations on your code, boosting your productivity!

Coding Buddy can read your codebase, write on selected files, and also just chat with you. It can also explain certain parts you don't understand, or fix some errors you point out.

NOTE: The extension is currently in test phase, so use with caution (and Git, of course)!

## Features:

- GPT models from 3.5, 4o, o1 and o3 mini
- Chat interface
- Multiple Chat histories
- Pop-up window with shortcut (Ctrl/CMD+Shift+Enter)

## Installation:

#### Prerequisites:

1. Visual Studio Code (1.90 or later)
2. OpenAI API Key ([read this](#get-api-key))
   1. OpenAI's ChatGPT Plus Subscription (optional, but recommended)
3. NodeJS (v20.14.0 or later, if you're building from source)

### Build Coding Buddy from source code

#### Building the app

1. Clone the repo to your local files.
2. Open the source code using Visual Studio Code
3. Run `npm install --legacy-peer-deps`
4. Press `f5` to run the debugger.

## First Use:

Before you first use the extension, there are some things you need to set up.

1. Open the settings page (shortcut on "chat" window)
2. Under "Coding Buddy Settings", you should at least fill out "Api Key", and change the Model, to something that you can use (gpt-3.5-turbo if you haven't got a GPT Plus Subscription, if you do, it's highly recommended to use either 4-turbo or 4o).

And you're good to go! Simple as that.

## Get API Key

1. Go to [OpenAI's API Login page](https://platform.openai.com/login?launch) and log in using your account.
   1. If there's a prompt to choose between ChatGPT and API, select API and proceed
2. On the top bar, select "Dashboard"

![Pasted image 20240611154202](https://github.com/labs-agap2it/coding-buddy/assets/68194332/39437483-beda-4e72-904f-1e611a11ef0c)

3. Look over on the sidebar, and select "API keys"

![Pasted image 20240611154358](https://github.com/labs-agap2it/coding-buddy/assets/68194332/db0c80e9-3063-460f-98e8-a6d5ed0a49b1)

4. Click on "Create new Secret Key"
   1. Give it a name if you wish, give it all Permissions, and create the key.
   2. Save it in a safe place for later use on the extension.
