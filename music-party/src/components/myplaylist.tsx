import { Text, Skeleton, Stack, Accordion, useToast, Flex, Select } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import * as api from "../api/api";
import { toastError } from "../utils/toast";
import { Playlist } from "./playlist";

export const MyPlaylist = (props: { apis: string[], enqueue: (id: string, apiName: string) => void }) => {
    const [canshow, setCanshow] = useState(false);
    const [playlists, setPlaylists] = useState<api.Playlist[]>([]);
    const [needBind, setNeedBind] = useState(false);
    const [apiName, setApiName] = useState("");
    const [playlistCache, setPlaylistCache] = useState<Map<string, api.Playlist[]>>(new Map<string, api.Playlist[]>());
    const t = useToast();

    useEffect(() => {
        api.getBindInfo().then((info: { key: string, value: string }[]) => {
            if (info.length > 0) {
                const defaultApi = info[0].key;
                setApiName(defaultApi);
            } else {
                setNeedBind(true);
                setCanshow(true);
            }
        });
    }, [props.apis]);

    useEffect(() => {
        if (!apiName) return;
        if (playlistCache.has(apiName)) {
            setPlaylists(playlistCache.get(apiName)!);
        } else {
            api.getMyPlaylist(apiName).then(resp => {
                setPlaylists(resp);
                setCanshow(true);
                setPlaylistCache(c => c.set(apiName, resp));
            }).catch(err => {
                toastError(t, err);
            });
        }
    }, [apiName]);

    return (<Stack>
        {canshow ?
            (
                needBind ? <Text>
                    Please bind your music service account first!
                    After that, refresh this page.
                </Text>
                    : <>
                        <Flex flexDirection={"row"} alignItems={"center"} mb={4}>
                            <Text>
                                Api Provider
                            </Text>
                            <Select ml={2} flex={1} onChange={e => {
                                setApiName(e.target.value);
                            }} defaultValue={apiName}>
                                {props.apis.map(a => {
                                    return <option key={a}>
                                        {a}
                                    </option>;
                                })}
                            </Select>
                        </Flex>
                        <Accordion allowMultiple>
                            {playlists.map(p =>
                                <Playlist key={p.id} id={p.id} name={p.name} apiName={apiName} enqueue={props.enqueue} />
                            )}
                        </Accordion>
                    </>
            )
            : <>
                <Skeleton height='20px' />
                <Skeleton height='20px' />
                <Skeleton height='20px' />
                <Skeleton height='20px' />
                <Skeleton height='20px' />
                <Skeleton height='20px' />
            </>}
    </Stack >)
}