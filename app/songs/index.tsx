import { Redirect, useLocalSearchParams } from "expo-router"

export default function SongsRedirect() {
  const params = useLocalSearchParams<{ region?: string }>()
  const href = params.region ? `/(tabs)/songs/index?region=${encodeURIComponent(params.region)}` : "/(tabs)/songs/index"
  return <Redirect href={href as any} />
}
