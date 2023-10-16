import { getPreferenceValues, Clipboard, showToast, Toast } from "@raycast/api";
import { MD5 } from "crypto-js";
import got from "got";

interface Preferences {
  shortlink_domain: string;
  shortlink_api_key: string;
}

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const shortlinkDomain = preferences.shortlink_domain;
  const shortlinkApiKey = preferences.shortlink_api_key;
  if (!shortlinkDomain) {
    await showToast({ title: "Shortlink domain is not set", style: Toast.Style.Failure });
  }
  if (!shortlinkApiKey) {
    await showToast({ title: "Shortlink API key is not set", style: Toast.Style.Failure });
  }

  const { text: clipboardText } = await Clipboard.read();
  if (!clipboardText) {
    await showToast({ title: "Clipboard is empty", style: Toast.Style.Failure });
  }

  const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/[\w.-]*)*\/?$/i;
  if (!clipboardText.match(urlPattern)) {
    await showToast({ title: "Clipboard is not a URL", style: Toast.Style.Failure });
  }

  const toast = await showToast({ title: "Shortening URL...", style: Toast.Style.Animated });

  const shortlinkUrl = `https://${shortlinkDomain}/api/new?link=${clipboardText}`;
  const hashedApiKey = MD5(shortlinkApiKey).toString();

  const response = await got.post(shortlinkUrl, {
    headers: {
      apiKey: hashedApiKey,
    },
  });

  const { status, newShortlink } = JSON.parse(response.body);

  if (status !== 200) {
    toast.title = "Error shortening URL";
    toast.style = Toast.Style.Failure;
  } else {
    await Clipboard.copy(newShortlink);
    toast.title = "Copied shortlink to clipboard";
    toast.style = Toast.Style.Success;
  }
}
