(async () => {
    delete window.$;
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
    let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;

    if(!ApplicationStreamingStore) {
        ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
        RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
        QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
        ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
        GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
        FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
        api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;
    } else {
        RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
        QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
        ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
        GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
        FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
        api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;	
    }

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now());

    if(quests.length === 0) {
        console.log("[TIREX] No uncompleted quests found.");
        return;
    }

    let isApp = typeof DiscordNative !== "undefined";
    console.log(`[TIREX] Found ${quests.length} quests. Starting parallel execution...`);

    quests.forEach(quest => {
        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
        
        if (!taskName) return;

        const secondsNeeded = taskConfig.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        const pid = Math.floor(Math.random() * 30000) + 1000;

        if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
            (async () => {
                console.log(`[TIREX] Spoofing video: ${questName}`);
                while(secondsDone < secondsNeeded) {
                    const timestamp = Math.min(secondsNeeded, secondsDone + 7 + Math.random());
                    const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp}});
                    secondsDone = timestamp;
                    if (res.body.completed_at) break;
                    await new Promise(r => setTimeout(r, 15000));
                }
                console.log(`[TIREX] Quest completed: ${questName}`);
            })();
        } 
        
        else if(taskName === "PLAY_ON_DESKTOP") {
            if(!isApp) {
                console.log(`[TIREX] ${questName} requires Discord Desktop App.`);
            } else {
                api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                    const appData = res.body[0];
                    const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
                    const fakeGame = {
                        cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                        exeName,
                        exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                        id: applicationId,
                        name: appData.name,
                        pid: pid,
                        pidPath: [pid],
                        processName: appData.name,
                        start: Date.now(),
                    };
                    
                    const realGetRunningGames = RunningGameStore.getRunningGames;
                    const realGetGameForPID = RunningGameStore.getGameForPID;
                    
                    RunningGameStore.getRunningGames = () => [fakeGame];
                    RunningGameStore.getGameForPID = () => fakeGame;
                    
                    FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [], added: [fakeGame], games: [fakeGame]});
                    
                    let fn = data => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                        console.log(`[TIREX] ${questName} progress: ${progress}/${secondsNeeded}`);
                        if(progress >= secondsNeeded) {
                            RunningGameStore.getRunningGames = realGetRunningGames;
                            RunningGameStore.getGameForPID = realGetGameForPID;
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                            console.log(`[TIREX] Quest completed: ${questName}`);
                        }
                    };
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                });
            }
        }

        else if(taskName === "STREAM_ON_DESKTOP") {
            if(!isApp) {
                console.log(`[TIREX] ${questName} requires Discord Desktop App.`);
            } else {
                let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: applicationId, pid, sourceName: null });
                
                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                    console.log(`[TIREX] ${questName} progress: ${progress}/${secondsNeeded}`);
                    if(progress >= secondsNeeded) {
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                        console.log(`[TIREX] Quest completed: ${questName}`);
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            }
        }

        else if(taskName === "PLAY_ACTIVITY") {
            (async () => {
                const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0)?.VOCAL[0]?.channel?.id;
                const streamKey = `call:${channelId}:1`;
                while(true) {
                    const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                    const progress = res.body.progress.PLAY_ACTIVITY.value;
                    console.log(`[TIREX] ${questName} progress: ${progress}/${secondsNeeded}`);
                    if(progress >= secondsNeeded) {
                        await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                        break;
                    }
                    await new Promise(r => setTimeout(r, 20000));
                }
                console.log(`[TIREX] Quest completed: ${questName}`);
            })();
        }
    });
})();
