import Head from 'next/head'
import React, { useEffect, useRef, useState } from 'react'
import { Connection, music } from '../src/api/musichub'
import { Text, Button, Card, CardBody, CardHeader, Grid, GridItem, Heading, Input, ListItem, OrderedList, Tab, TabList, TabPanel, TabPanels, Tabs, useToast, Stack, Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverFooter, PopoverHeader, PopoverTrigger, Portal, UnorderedList, Flex, Highlight, Box } from '@chakra-ui/react'
import { MusicPlayer } from '../src/components/musicplayer';
import { getMusicApis, getProfile } from '../src/api/api';
import { NeteaseBinder } from '../src/components/neteasebinder';
import { MyPlaylist } from '../src/components/myplaylist';
import { toastEnqueueOk, toastError } from '../src/utils/toast';
import { MusicSelector } from '../src/components/musicselector';
import { QQMusicBinder } from '../src/components/qqmusicbinder';

export default function Home() {
  const [src, setSrc] = useState("");
  const [playtime, setPlaytime] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<{ music: music, enqueuer: string }>();
  const [queue, setQueue] = useState<{ music: music, enqueuerName: string }[]>([]);
  const [userName, setUserName] = useState("");
  const [newName, setNewName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<{ id: string, name: string }[]>([]);
  const [inited, setInited] = useState(false);
  const [chatContent, setChatContent] = useState<{ name: string, content: string }[]>([]);
  const [chatToSend, setChatToSend] = useState("");
  const [apis, setApis] = useState<string[]>([]);
  const t = useToast();

  const conn = useRef<Connection>();
  useEffect(() => {
    if (!conn.current) {
      conn.current = new Connection(
        `${window.location.origin}/music`,
        async (music: music, enqueuerName: string, playedTime: number) => {
          console.log(music);
          setSrc(music.url);
          setNowPlaying({ music, enqueuer: enqueuerName });
          setPlaytime(playedTime);
        },
        async (music: music, enqueuerName: string) => {
          setQueue(q => q.concat({ music, enqueuerName: enqueuerName }));
        },
        async () => {
          setQueue(q => q.slice(1));
        },
        async (id: string, name: string) => {
          setOnlineUsers(u => u.concat({ id, name }));
        },
        async (id: string) => {
          setOnlineUsers(u => u.filter(x => x.id !== id));
        },
        async (id: string, newName: string) => {
          setOnlineUsers(u =>
            u.map(x => x.id === id ? { id, name: newName } : x)
          );
        },
        async (name: string, content: string) => {
          setChatContent(c => c.concat({ name, content }));
        },
        async (content: string) => {
          // todo
          console.log(content);
        },
        async (msg: string) => {
          console.error(msg);
          toastError(t, msg);
        }
      );
      conn.current.start().then(async () => {
        try {
          const queue = await conn.current!.getMusicQueue();
          setQueue(queue);
          const users = await conn.current!.getOnlineUsers();
          setOnlineUsers(users);
        } catch (err: any) {
          toastError(t, err);
        }
      }).catch(e => {
        console.error(e);
        toastError(t, "Please refresh this page to retry.");
      });

      getProfile().then((u) => {
        setUserName(u.name);
      }).catch((e) => {
        console.error(e);
        toastError(t, "Please refresh this page to retry.");
      });

      getMusicApis().then(as => setApis(as));

      setInited(true);
    }
  }, []);

  useEffect(() => {

  }, [conn]);

  return (
    <Grid templateAreas={`"nav main"`} gridTemplateColumns={"2fr 5fr"} gap="1">
      <Head>
        <title>Music Party</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GridItem area={"nav"}>
        <Stack m={4} spacing={4}>
          <Card>
            <CardHeader>
              <Heading>{`Welcome, ${userName}!`}</Heading>
            </CardHeader>
            <CardBody>
              <Stack>
                <Popover>
                  {({ onClose }) => (<>
                    <PopoverTrigger>
                      <Button>Rename</Button>
                    </PopoverTrigger>
                    <Portal>
                      <PopoverContent>
                        <PopoverArrow />
                        <PopoverHeader>Rename</PopoverHeader>
                        <PopoverCloseButton />
                        <PopoverBody>
                          <Input value={newName} placeholder={"Input your new name here."}
                            onChange={(e) => setNewName(e.target.value)}>
                          </Input>
                        </PopoverBody>
                        <PopoverFooter>
                          <Button colorScheme='blue' onClick={async () => {
                            if (newName === "") return;
                            await conn.current!.rename(newName);
                            const user = await getProfile();
                            setUserName(user.name);
                            onClose();
                            setNewName("");
                          }}>Comfirm</Button>
                        </PopoverFooter>
                      </PopoverContent>
                    </Portal>
                  </>)}
                </Popover>
                <NeteaseBinder />
                <QQMusicBinder />
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading>
                Online Users
              </Heading>
            </CardHeader>
            <CardBody>
              <UnorderedList>
                {onlineUsers.map((u) => {
                  return <ListItem key={u.id}>
                    {u.name}
                  </ListItem>
                })}
              </UnorderedList>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading>
                Chat
              </Heading>
            </CardHeader>
            <CardBody>
              <Flex>
                <Input flex={1} value={chatToSend} onChange={e => setChatToSend(e.target.value)} />
                <Button ml={2} onClick={async () => {
                  if (chatToSend === "") return;
                  await conn.current?.chatSay(chatToSend);
                  setChatToSend("");
                }}>Send</Button>
              </Flex>
              <UnorderedList>
                {chatContent.map(s => <ListItem key={Math.random() * 1000}>
                  {`${s.name}: ${s.content}`}
                </ListItem>)}
              </UnorderedList>
            </CardBody>
          </Card>
        </Stack>
      </GridItem>

      <GridItem area={"main"}>
        <Tabs>
          <TabList>
            <Tab>
              Music Play
            </Tab>
            <Tab>
              Select Music
            </Tab>
            <Tab>
              My Playlists
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Flex flexDirection={"row"} mb={4} alignItems={"flex-end"}>
                {nowPlaying ? <>
                  <Heading>
                    {`Now Playing:\n ${nowPlaying?.music.name} - ${nowPlaying?.music.artists}`}
                  </Heading>
                  <Text size={"md"} fontStyle={"italic"} ml={2}>
                    {`Enqueued by ${nowPlaying?.enqueuer}`}
                  </Text>
                </> : <Heading>
                  Now Playing: Nothing
                </Heading>
                }
              </Flex>

              <MusicPlayer src={src} playtime={playtime} nextClick={() => {
                conn.current?.nextSong();
              }} reset={() => {
                console.log("reset");
                conn.current!.requestSetNowPlaying();
                conn.current!.getMusicQueue().then(q => {
                  setQueue(q);
                });
              }} />

              <Card mt={4}>
                <CardHeader>
                  <Heading size={"lg"}>Queue</Heading>
                </CardHeader>
                <CardBody>
                  <OrderedList>
                    {queue.length > 0 ? queue.map((v) => (
                      <ListItem key={Math.random() * 1000} fontSize={"lg"}>
                        <Box>
                          {v.music.name} - {v.music.artists}
                          <Text fontSize={"sm"} fontStyle={"italic"}>
                            enqueued by {v.enqueuerName}
                          </Text>
                        </Box>
                      </ListItem>)) : <Text size={"md"}>
                      <Highlight query={"enqueue"} styles={{ px: '2', py: '1', rounded: 'full', bg: 'teal.100' }}>
                        The queue is null currently, feel free to enqueue some music.
                      </Highlight>
                    </Text>}
                  </OrderedList>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel>
              <MusicSelector apis={apis} conn={conn.current!} />
            </TabPanel>
            <TabPanel>
              {!inited ? <Text>Initializing...</Text> :
                <MyPlaylist apis={apis} enqueue={(id, apiName) => {
                  conn.current!.enqueueMusic(id, apiName)
                    .then(() => {
                      toastEnqueueOk(t);
                    }).catch(() => {
                      toastError(t, `Enqueuing music {id: ${id}} failed.`);
                    })
                }} />
              }
            </TabPanel>
          </TabPanels>
        </Tabs>
      </GridItem>
    </Grid>
  )
}
