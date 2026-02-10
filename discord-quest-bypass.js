(async () => {
    delete window.$;
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    const findModule = (filter) => {
        for (const i in wpRequire.c) {
            const m = wpRequire.c[i].exports;
            if (!m) continue;
            const targets = [m.Z, m.ZP, m.default, m.Ay, m.Bo, m.tn, m.A, m].filter(t => t && typeof t === 'object');
            for (const t of targets) {
                try { if (filter(t)) return t; } catch (e) { }
            }
        }
    };

    let ApplicationStreamingStore, RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;
    try {
        ApplicationStreamingStore = findModule(m => m.getStreamerActiveStreamMetadata);
        RunningGameStore = findModule(m => m.getRunningGames);
        QuestsStore = findModule(m => m.getQuest && (m.quests || m.getQuests));
        ChannelStore = findModule(m => m.getSortedPrivateChannels || m.getAllThreadsForParent);
        GuildChannelStore = findModule(m => m.getSFWDefaultChannel);
        FluxDispatcher = findModule(m => m.flushWaitQueue);
        api = findModule(m => m.get && m.post && m.put);
    } catch (e) { console.error("[TIREX] Failed to get Discord module."); return; }

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    const rawQuests = QuestsStore?.quests;
    let quests = (rawQuests instanceof Map ? Array.from(rawQuests.values()) : Object.values(rawQuests || {}))
        .filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now());

    if (quests.length === 0) return console.log("[TIREX] All quests are completed!");

    let isApp = typeof DiscordNative !== "undefined";
    console.log(`[TIREX] Executing ${quests.length} quest... 🦖🔥`);

    quests.forEach(quest => {

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const appId = quest.config.application.id;
        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
        const secondsNeeded = taskConfig.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        if (!taskName) return;

        if (taskName.includes("VIDEO")) {
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
            api.get({ url: `/applications/public?application_ids=${appId}` }).then(res => {
                const appData = res.body[0];
                const exeName = appData.executables.find(x => x.os === "win32").name.replace(">", "");
                const fakeGame = {
                    id: appId, name: appData.name, pid: pid, pidPath: [pid], start: Date.now(),
                    exeName, exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`
                };
                const realGetGames = RunningGameStore.getRunningGames;
                RunningGameStore.getRunningGames = () => [fakeGame];
                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [], added: [fakeGame], games: [fakeGame] });

                let checkProgress = (data) => {
                    let progress = Math.floor(data.userStatus.progress[type].value);
                    console.log(`[TIREX] [${taskName}] Progress: ${progress}/${secondsNeeded}`);
                    if (progress >= secondsNeeded) {
                        RunningGameStore.getRunningGames = realGetGames;
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", checkProgress);
                        console.log(`[TIREX] ${taskName} Done!`);
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", checkProgress);
            });
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
