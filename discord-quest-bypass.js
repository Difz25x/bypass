let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata).exports.Z;
let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;

let isApp = typeof DiscordNative !== "undefined";

// Get ALL active quests instead of just one
let quests = [...QuestsStore.quests.values()].filter(x => 
    x.id !== "1412491570820812933" && 
    x.userStatus?.enrolledAt && 
    !x.userStatus?.completedAt && 
    new Date(x.config.expiresAt).getTime() > Date.now()
);

if(quests.length === 0) {
    console.log("You don't have any uncompleted quests!");
} else {
    console.log(`Found ${quests.length} active quest(s):`);
    quests.forEach((quest, index) => {
        console.log(`${index + 1}. ${quest.config.messages.questName} (ID: ${quest.id})`);
    });
    console.log("Starting quest processing...");

    quests.forEach((quest, index) => {
        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        
        // CRITICAL CHECK: Ensure taskConfig and its tasks exist
        if (!taskConfig || !taskConfig.tasks) {
            console.log(`
[Quest ${index + 1}/${quests.length}] Skipping: ${questName}`);
            console.log(`  ❌ Reason: No valid task configuration found.`);
            return; // Skip to the next quest in the loop
        }

        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null);
        
        // CRITICAL CHECK: Ensure a valid taskName was found
        if (!taskName) {
            console.log(`
[Quest ${index + 1}/${quests.length}] Skipping: ${questName}`);
            console.log(`  ❌ Reason: No supported task type found in configuration.`);
            return; // Skip to the next quest
        }

        // CRITICAL CHECK: Ensure the target for the found task exists
        const targetValue = taskConfig.tasks[taskName]?.target;
        if (targetValue === undefined) {
            console.log(`
[Quest ${index + 1}/${quests.length}] Skipping: ${questName}`);
            console.log(`  ❌ Reason: Task "${taskName}" has no target value.`);
            return; // Skip to the next quest
        }

        const secondsNeeded = targetValue; // Now safe to use
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

        console.log(`
[Quest ${index + 1}/${quests.length}] Processing: ${questName}`);
        console.log(`  Type: ${taskName}, Progress: ${secondsDone}/${secondsNeeded} seconds`);

        if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            handleVideoQuest(quest, taskName, secondsNeeded, secondsDone);
        } else if(taskName === "PLAY_ON_DESKTOP") {
            if(!isApp) {
                console.log(`  ⚠️  Skipping: This quest requires Discord Desktop app. Use the desktop app to complete "${questName}".`);
            } else {
                handlePlayOnDesktopQuest(quest, taskName, secondsNeeded, secondsDone);
            }
        } else if(taskName === "STREAM_ON_DESKTOP") {
            if(!isApp) {
                console.log(`  ⚠️  Skipping: This quest requires Discord Desktop app. Use the desktop app to complete "${questName}".`);
            } else {
                handleStreamOnDesktopQuest(quest, taskName, secondsNeeded, secondsDone);
            }
        } else if(taskName === "PLAY_ACTIVITY") {
            handlePlayActivityQuest(quest, taskName, secondsNeeded, secondsDone);
        } else {
            console.log(`  ❌ Skipping: Unknown quest type "${taskName}"`);
        }
    });
}

function handleVideoQuest(quest, taskName, secondsNeeded, secondsDone) {
    const maxFuture = 10, speed = 7, interval = 1;
    const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
    let completed = false;
    
    let fn = async () => {            
        while(true) {
            const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture;
            const diff = maxAllowed - secondsDone;
            const timestamp = secondsDone + speed;
            if(diff >= speed) {
                try {
                    const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
                    completed = res.body.completed_at != null;
                    secondsDone = Math.min(secondsNeeded, timestamp);
                } catch (err) {
                    console.log(`  ⚠️  API Error for ${quest.config.messages.questName}:`, err.message);
                    break;
                }
            }
            
            if(timestamp >= secondsNeeded) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
        if(!completed) {
            try {
                await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
                console.log(`  ✅ Quest "${quest.config.messages.questName}" completed!`);
            } catch (err) {
                console.log(`  ❌ Failed to complete ${quest.config.messages.questName}:`, err.message);
            }
        } else {
            console.log(`  ✅ Quest "${quest.config.messages.questName}" completed!`);
        }
    };
    fn();
    console.log(`  ▶️  Spoofing video progress. Estimated time: ${Math.ceil((secondsNeeded - secondsDone) / speed)} seconds`);
}

function handlePlayOnDesktopQuest(quest, taskName, secondsNeeded, secondsDone) {
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const applicationId = quest.config.application.id;
    const applicationName = quest.config.application.name;
    
    api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
        const appData = res.body[0];
        const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
        
        const fakeGame = {
            cmdLine: `C:\Program Files\${appData.name}\${exeName}`,
            exeName,
            exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
            hidden: false,
            isLauncher: false,
            id: applicationId,
            name: appData.name,
            pid: pid,
            pidPath: [pid],
            processName: appData.name,
            start: Date.now(),
        };
        const realGames = RunningGameStore.getRunningGames();
        const fakeGames = [fakeGame];
        const realGetRunningGames = RunningGameStore.getRunningGames;
        const realGetGameForPID = RunningGameStore.getGameForPID;
        RunningGameStore.getRunningGames = () => fakeGames;
        RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
        FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});
        
        let fn = data => {
            let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
            console.log(`  Progress: ${progress}/${secondsNeeded}`);
            
            if(progress >= secondsNeeded) {
                console.log(`  ✅ Quest "${quest.config.messages.questName}" completed!`);
                
                RunningGameStore.getRunningGames = realGetRunningGames;
                RunningGameStore.getGameForPID = realGetGameForPID;
                FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            }
        };
        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        
        console.log(`  ▶️  Spoofed game: ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} minutes`);
    }).catch(err => {
        console.log(`  ❌ Error: Could not fetch application data for ${applicationName}`);
    });
}

function handleStreamOnDesktopQuest(quest, taskName, secondsNeeded, secondsDone) {
    const pid = Math.floor(Math.random() * 30000) + 1000;
    const applicationId = quest.config.application.id;
    const applicationName = quest.config.application.name;
    
    let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
        id: applicationId,
        pid,
        sourceName: null
    });
    
    let fn = data => {
        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
        console.log(`  Progress: ${progress}/${secondsNeeded}`);
        
        if(progress >= secondsNeeded) {
            console.log(`  ✅ Quest "${quest.config.messages.questName}" completed!`);
            
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        }
    };
    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
    
    console.log(`  ▶️  Spoofed stream: ${applicationName}. Stream any window in VC for ${Math.ceil((secondsNeeded - secondsDone) / 60)} minutes`);
    console.log(`  ⚠️  Remember: You need at least 1 other person in the VC!`);
}

function handlePlayActivityQuest(quest, taskName, secondsNeeded, secondsDone) {
    const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
    const streamKey = `call:${channelId}:1`;
    
    let fn = async () => {
        console.log(`  ▶️  Starting activity quest completion`);
        
        while(true) {
            try {
                const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                const progress = res.body.progress.PLAY_ACTIVITY.value;
                console.log(`  Progress: ${progress}/${secondsNeeded}`);
                
                await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                
                if(progress >= secondsNeeded) {
                    await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                    break;
                }
            } catch (err) {
                console.log(`  ⚠️  API Error for ${quest.config.messages.questName}:`, err.message);
                break;
            }
        }
        
        console.log(`  ✅ Quest "${quest.config.messages.questName}" completed!`);
    };
    fn();
}
