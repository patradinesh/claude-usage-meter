# usage-meter

Live per-session usage in Claude Code: tokens, cache hit and session cost. It reads figures the engine already reports, so it costs no tokens.

> **Costs no tokens.** The mod only displays figures the engine already reports. It makes no model calls and adds nothing to your context.

![usage-meter band above the prompt, with turn detail on](docs/band.png)

## Install

At the prompt of a terminal session:

```
/plugin install usage-meter --marketplace patradinesh/claude-usage-meter
```

From a shell:

```
claude plugin install usage-meter --marketplace patradinesh/claude-usage-meter
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `patradinesh/claude-usage-meter`, then Add plugin.

## What it shows

```
Tokens: In: 1.0k, Out: 300, Cache: 80%                    Session Cost: $0.50
```

- **In / Out:** tokens this session. In includes cached input.
- **Cache:** share of input read from the prompt cache.
- **Session Cost:** what this session has cost so far.

With detail on, a second row adds last turn time and cost, total time, turn count and average cost per turn.

## Choose where and how

Run `/usage-meter`:

| Command | Effect |
| --- | --- |
| `/usage-meter` | Show current settings and help |
| `/usage-meter band` | Row above the prompt (default) |
| `/usage-meter status` | Status line. The engine adds the plugin name as a label, and long text can truncate |
| `/usage-meter detail on` / `off` | Turn detail row on or off |

Choices are saved across sessions. The same options are in the plugin's config menu as the defaults.

## Limits

- Counts start when the mod loads, so earlier turns in a session are not counted.
- Per-turn cost is the rise in session cost during the turn. Subagent cost is included.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/patradinesh/claude-usage-meter/issues).

## License

[MIT](LICENSE)
