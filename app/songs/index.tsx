import { Redirect, useLocalSearchParams } from "expo-router"

export default function SongsRedirect() {
  const params = useLocalSearchParams<{ region?: string; query?: string }>()
  const search = new URLSearchParams()
  if (params.region) search.set("region", params.region)
  if (params.query) search.set("query", params.query)
  const href = search.toString().length > 0 ? `/(tabs)/songs?${search.toString()}` : "/(tabs)/songs"
  return <Redirect href={href as never} />
}
