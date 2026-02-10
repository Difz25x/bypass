(async () => {
    delete window.$;
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
    let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;
    try {
        if (!ApplicationStreamingStore) {
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
    } catch (e) { console.error("[TIREX] Failed to get Discord module."); return; }

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    const rawQuests = QuestsStore?.quests;
    let quests = (rawQuests instanceof Map ? Array.from(rawQuests.values()) : Object.values(rawQuests || {}))
        .filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now());

    if (quests.length === 0) return console.log("[TIREX] All quests are completed!");

    let isApp = typeof DiscordNative !== "undefined";
    console.log(`[TIREX] Executing ${quests.length} quest... 🦖🔥`);

    quests.forEach(quest => {
        const pid = Math.floor(Math.random() * 30000) + 1000
        const applicationId = quest.config.application.id
        const applicationName = quest.config.application.name
        const questName = quest.config.messages.questName
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null)
        const secondsNeeded = taskConfig.tasks[taskName].target
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0
        if (!taskName) return;

        if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            let fn = async () => {
                while (secondsDone < secondsNeeded) {
                    secondsDone += 7;
                    const res = await api.post({
                        url: `/quests/${quest.id}/video-progress`,
                        body: { timestamp: Math.min(secondsNeeded, secondsDone + Math.random()) }
                    });
                    console.log(`[TIREX] [${taskName}] Progress: ${Math.min(secondsDone, secondsNeeded)}/${secondsNeeded}`);
                    if (res.body.completed_at) break;
                    await new Promise(r => setTimeout(r, 1500));
                }
                console.log(`[TIREX] ${taskName} Done!`);
            };
            fn();
        } else if (taskName === "PLAY_ON_DESKTOP" && isApp) {
            api.get({ url: `/applications/public?application_ids=${applicationId}` }).then(res => {
                const appData = res.body[0]
                const exeName = appData.executables.find(x => x.os === "win32").name.replace(">", "")

                const fakeGame = {
                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
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
                }
                const realGames = RunningGameStore.getRunningGames()
                const fakeGames = [fakeGame]
                const realGetRunningGames = RunningGameStore.getRunningGames
                const realGetGameForPID = RunningGameStore.getGameForPID
                RunningGameStore.getRunningGames = () => fakeGames
                RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames })

                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)

                    if (progress >= secondsNeeded) {
                        RunningGameStore.getRunningGames = realGetRunningGames
                        RunningGameStore.getGameForPID = realGetGameForPID
                        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] })
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                        doJob()
                    }
                }
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                console.log(`[TIREX] [${taskName}] Progress: ${Math.min(secondsDone, secondsNeeded)}/${secondsNeeded}`);
            });
        } else if (taskName === "STREAM_ON_DESKTOP" && isApp) {
            let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                id: applicationId,
                pid,
                sourceName: null
            })

            let fn = data => {
                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
                if (progress >= secondsNeeded) {
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                    doJob()
                }
            }

            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

            console.log(`[TIREX] [${taskName}] Progress: ${Math.min(secondsDone, secondsNeeded)}/${secondsNeeded}`);
        } else if (taskName === "PLAY_ACTIVITY") {
            (async () => {
                const chId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0)?.VOCAL[0].channel.id;
                const key = `call:${chId}:1`;
                while (secondsDone < secondsNeeded) {
                    const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: key, terminal: false } });
                    secondsDone = res.body.progress.PLAY_ACTIVITY.value;
                    console.log(`[TIREX] [${taskName}] Progress: ${secondsDone}/${secondsNeeded}`);
                    if (secondsDone >= secondsNeeded) {
                        await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: key, terminal: true } });
                        break;
                    }
                    await new Promise(r => setTimeout(r, 20000));
                }
            })();
        }
    });
})();
