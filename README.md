# Streamer

Unleash all your streaming potential with Sharkord and your favorite WHIP apps.

A Sharkord plugin that lets users stream from OBS or any other WHIP app into the
voice channel they're in. Viewers see it like a screen share.

## Using it

1. Open your user settings in Sharkord. The **Streaming software** section has
   your Server URL and Bearer Token.
2. In your streaming app, choose WHIP and paste both.
3. Join a voice channel, then start streaming.

| Setting           | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| Video encoder     | Any H.264 encoder (x264, NVENC, QuickSync, AMF) or AV1 |
| H.264 profile     | Baseline, Main or High                                 |
| Keyframe interval | 1 or 2 seconds                                         |
| B-frames          | Off                                                    |
| Audio encoder     | Opus                                                   |

The video is forwarded as is, never re-encoded, so it has to be something
browsers can play.

If a stream fails, Sharkord shows the reason in a dialog. Streaming apps only
show a generic connection error.

## Admin settings

- **Stop streams when the streamer leaves voice** (on by default)
- **Move streams with their streamer** when they switch voice channels (on by
  default)
- **Maximum stream bitrate (kbps)**. 0 means no limit. A stream that stays above
  it for about 15 seconds is stopped, and the streamer can't stream again for a
  minute.

Streaming needs the Share Screen permission, both server-wide and in the voice
channel.
