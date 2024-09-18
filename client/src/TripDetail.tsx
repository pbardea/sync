import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image } from "./Trips"
import { observer } from "mobx-react"
import { cn } from "./lib/utils"
import { Link } from "react-router-dom"
import { ScrollArea, ScrollBar } from "./components/ui/scroll-area"
import { AttractionFilterComponent, CityFilter, RatingFilter } from "./components/attraction-filter"

import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from "react-leaflet-cluster";
import arcades from '/Users/paul/Downloads/arcades.json'

export const TripDetail = observer(() => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">Autumn in Japan</h1>
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U2</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <p className="text-gray-600">Oct 17 - Oct 31 2023</p>
      <Tabs defaultValue="browse" className="mt-4">
        <TabsList>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
        </TabsList>
        <TabsContent value="browse">
          <section className="mb-12">
            <div
              className="flex items-left justify-between"
              style={{ paddingTop: 35 }}
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">My Trips</h2>
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex flex-row gap-4">
                {[
                  { title: "Onsen in Gunma", desc: "Relaxing all-inclusive onsen", photo: "https://previews.dropbox.com/p/thumb/ACYlALB0EChtUaMIowfbHEQFwX_WuJsOYqYewc-Fzj2966TyUCxACPR7HHY3ma75pOViJof_FoQTR_YvN6Km6q_yAnT3willy41jZHMe_GyjsUb11yESC-aJEoyG2degofOEb1U75Vg6QxZP6EUrtaXAvPjk-Fsy3u1F6AET1b-w9UcCkBLWRtU_YJYYjJU1IAH12rW4FtwfBFVEjfJLp-kn-ZTevQlc-vCVP8k_qPiEAM0wZfVe6581jmsKK1-gsJOHDq4aJPednwGLbxziJttwKCeYS5o0yRABR18bo8lwUDfW4mAVJdgw9TBe776hNYbmcJDfq-hCg1U2NqJEavQsSuc1J6dFONQFhRjdcrNWKAU0tk3fARzJjumTx04Nqzwlb7dqKkrDxTM7TYRRhXD8/p.png?is_prewarmed=true" },
                  { title: "Golden Pavilion", desc: "Historic cultural classic", photo: "https://previews.dropbox.com/p/thumb/ACZ8lQSox1XWkPNctZkhq7WzxsmJMYIDP33HYSjOgokSqTLSvgDtVVUFLpgTSfFPdYdVMwftCc7APXGEe4hxJwjUAsjh3Oo2TfkJQAHPO7pbSg2kbaXjG0rfVF-eBdv8cD6pHDpU7GJVhb5gBGpHDI9Hmx4QzmWUBYjFg2jFlFBoDt-_-j3QOcV2zNR61vehqohGXkqbFeClOVk8XMoMuoEpUsgYUSH85ERP0Es6MQ77AVNbVlhSs2E91RySBcAiW3pcORwtPeeWOauxg7qOCzMTVXeXDu53y3y4t4wFXd8UUgYY_LFU9LDD1eBVmbjnDRE5bA5Dxo8o-CAFa2Tv1B6HFgxFKECCww3qDUqshSgmSRaGilCNtTQK2oxG-Wiuul15hVcpZkkBxFAOma1E2DLb/p.png?is_prewarmed=true" },
                  { title: "Kumamoto Castle", desc: "Historic castle", photo: "https://previews.dropbox.com/p/thumb/ACawUN5ZZBfX64pNBXfheA6gM5ltZGKhAyilz0BYmAvdlNytWl2vgKeBZJo3cAIsv-FVdRYb3N4zTxgsFj0JlxdeVp-dI0IhlC8LCq5HwFj8PV2F5GdrP-HAN1VYXyvX2PSOPdXIP9jk1QF0ANseEi1Kf53BklREF_ODCUB-52VoUVx1ctT5qBflfygw_sswW24UX6IGr45451m0vrAmQeDJ-LFAj3_XVhbVFmzj833frfSiUfSe5iDUhbzwa82QLh0vGhd4if9QJ8aqa31VGZ5ke6wWeqBqsyUYsx6T8kkwO5oL50VQAeGWl4sgBCpUhUZLAkIQ6Bs1pZ44MWN59gdg4fWeFEA1m5Euv5rD7olXcdjElXvCjxdElN_M7pf46IqYEIFrTmvraQOPBaN_b9KdWGwKgz1XDARwMMFMlLZs7DNg953TwB1Ao8nRB8seGbtv5zsCA0IwTAlo3unc6YR8/p.png?is_prewarmed=true" },
                  { title: "A-Bomb Dome", desc: "Directly under the hypocenter", photo: "https://previews.dropbox.com/p/thumb/ACZ2WG8gXVM70P01SRBDOuVcI_MsBk15rpgaXk6jLiAwkaJVLf_VSqEWgPW-OlKMO-EPbua648NlmoIOQq3hfEBWL9ft5AOvNs3lJPaW0yyWoJkeb4yjMFsmMr82cNlRrDvcCZ4y-9QhFXVKe-L0t_dG_7ukVUH8P2rFBlDPd8L2dYsOi2urdoOkTVhOss6ANxkOok8bBJGUbR-kvLLKFP85zgh6pqzYo5C3321Gr7GtXk2ZFbvI3gLP7zxP3D0hUwkIdc2vE6b3JPurnmUHeHb7BmfKSn7SqrdTEqvJ3EpuyIlBWpbWdCQIIbe8C3M6fzzHi_YevjnDGIRm1VHbGAda/p.png?is_prewarmed=true" },
                  { title: "Glitch Coffee Ginza", desc: "Specialty beans, dedicated service", photo: "https://previews.dropbox.com/p/thumb/ACaae0tnQMKgeUhNeO-QfyQXh89gAn7HM5qwlJ5KvW7w5ionmytOvKfWqN7XUQG_5w-ORncab8nnv0Myb8D7pika7PsKUpbtPT5Gfq7MuF8XadH6V4vjT48eQemeXvnJ7zFGav5KsN1qkfZxHTxHQjHhfuexy3rNb4wSLmMmVzpOdPw0OcoN79L_6o6tCduPFqV1l3oexx1NFcIEPRS1Dj3wv3id4k5ls7LDzNNdLGxuFeBezltxJV4YSiW48_YtCd4T60pwVmWv89KhYUrD8kwroF7idXa95xNKbDq1ysZNkF_0XhOmcnKYwnlACjg6ZFUeB2NshDxzdCc1QNgNjT7O/p.png?is_prewarmed=true" },
                ].map((item, index) => (
                  <Link key={index} to={`/trips/${index}`}>
                    <div className="overflow-hidden rounded-md">
                      <Image
                        src={item.photo ?? ""}
                        alt={item.title}
                        width={250}
                        height={330}
                        className={cn(
                          "h-auto w-auto object-cover transition-all hover:scale-105",
                          "aspect-[3/4]",
                        )}
                      />
                    </div>
                    <div className="space-y-1 text-sm" style={{ paddingTop: 4 }}>
                      <h3 className="font-medium leading-none">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
                <ScrollBar orientation="horizontal" />
              </div>
            </ScrollArea>
          </section>

          <section className="mb-12">
            <div
              className="flex items-left justify-between"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Cities</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: "Gunma", desc: "Escape in the mountains", photo: "https://previews.dropbox.com/p/thumb/ACYlALB0EChtUaMIowfbHEQFwX_WuJsOYqYewc-Fzj2966TyUCxACPR7HHY3ma75pOViJof_FoQTR_YvN6Km6q_yAnT3willy41jZHMe_GyjsUb11yESC-aJEoyG2degofOEb1U75Vg6QxZP6EUrtaXAvPjk-Fsy3u1F6AET1b-w9UcCkBLWRtU_YJYYjJU1IAH12rW4FtwfBFVEjfJLp-kn-ZTevQlc-vCVP8k_qPiEAM0wZfVe6581jmsKK1-gsJOHDq4aJPednwGLbxziJttwKCeYS5o0yRABR18bo8lwUDfW4mAVJdgw9TBe776hNYbmcJDfq-hCg1U2NqJEavQsSuc1J6dFONQFhRjdcrNWKAU0tk3fARzJjumTx04Nqzwlb7dqKkrDxTM7TYRRhXD8/p.png?is_prewarmed=true" },
                { name: "Kyoto", desc: "Fall leaves and warm vibes", photo: "https://previews.dropbox.com/p/thumb/ACZ8lQSox1XWkPNctZkhq7WzxsmJMYIDP33HYSjOgokSqTLSvgDtVVUFLpgTSfFPdYdVMwftCc7APXGEe4hxJwjUAsjh3Oo2TfkJQAHPO7pbSg2kbaXjG0rfVF-eBdv8cD6pHDpU7GJVhb5gBGpHDI9Hmx4QzmWUBYjFg2jFlFBoDt-_-j3QOcV2zNR61vehqohGXkqbFeClOVk8XMoMuoEpUsgYUSH85ERP0Es6MQ77AVNbVlhSs2E91RySBcAiW3pcORwtPeeWOauxg7qOCzMTVXeXDu53y3y4t4wFXd8UUgYY_LFU9LDD1eBVmbjnDRE5bA5Dxo8o-CAFa2Tv1B6HFgxFKECCww3qDUqshSgmSRaGilCNtTQK2oxG-Wiuul15hVcpZkkBxFAOma1E2DLb/p.png?is_prewarmed=true" },
                { name: "Kumamoto", desc: "Castle hunting", photo: "https://previews.dropbox.com/p/thumb/ACawUN5ZZBfX64pNBXfheA6gM5ltZGKhAyilz0BYmAvdlNytWl2vgKeBZJo3cAIsv-FVdRYb3N4zTxgsFj0JlxdeVp-dI0IhlC8LCq5HwFj8PV2F5GdrP-HAN1VYXyvX2PSOPdXIP9jk1QF0ANseEi1Kf53BklREF_ODCUB-52VoUVx1ctT5qBflfygw_sswW24UX6IGr45451m0vrAmQeDJ-LFAj3_XVhbVFmzj833frfSiUfSe5iDUhbzwa82QLh0vGhd4if9QJ8aqa31VGZ5ke6wWeqBqsyUYsx6T8kkwO5oL50VQAeGWl4sgBCpUhUZLAkIQ6Bs1pZ44MWN59gdg4fWeFEA1m5Euv5rD7olXcdjElXvCjxdElN_M7pf46IqYEIFrTmvraQOPBaN_b9KdWGwKgz1XDARwMMFMlLZs7DNg953TwB1Ao8nRB8seGbtv5zsCA0IwTAlo3unc6YR8/p.png?is_prewarmed=true" },
                { name: "Hiroshima", desc: "Peace and beauty", photo: "https://previews.dropbox.com/p/thumb/ACZ2WG8gXVM70P01SRBDOuVcI_MsBk15rpgaXk6jLiAwkaJVLf_VSqEWgPW-OlKMO-EPbua648NlmoIOQq3hfEBWL9ft5AOvNs3lJPaW0yyWoJkeb4yjMFsmMr82cNlRrDvcCZ4y-9QhFXVKe-L0t_dG_7ukVUH8P2rFBlDPd8L2dYsOi2urdoOkTVhOss6ANxkOok8bBJGUbR-kvLLKFP85zgh6pqzYo5C3321Gr7GtXk2ZFbvI3gLP7zxP3D0hUwkIdc2vE6b3JPurnmUHeHb7BmfKSn7SqrdTEqvJ3EpuyIlBWpbWdCQIIbe8C3M6fzzHi_YevjnDGIRm1VHbGAda/p.png?is_prewarmed=true" },
                { name: "Tokyo", desc: "Bustling metropolis, Cafe central", photo: "https://previews.dropbox.com/p/thumb/ACaae0tnQMKgeUhNeO-QfyQXh89gAn7HM5qwlJ5KvW7w5ionmytOvKfWqN7XUQG_5w-ORncab8nnv0Myb8D7pika7PsKUpbtPT5Gfq7MuF8XadH6V4vjT48eQemeXvnJ7zFGav5KsN1qkfZxHTxHQjHhfuexy3rNb4wSLmMmVzpOdPw0OcoN79L_6o6tCduPFqV1l3oexx1NFcIEPRS1Dj3wv3id4k5ls7LDzNNdLGxuFeBezltxJV4YSiW48_YtCd4T60pwVmWv89KhYUrD8kwroF7idXa95xNKbDq1ysZNkF_0XhOmcnKYwnlACjg6ZFUeB2NshDxzdCc1QNgNjT7O/p.png?is_prewarmed=true" },
              ].map((city, index) => (
                <Link key={index} to={`/trips/${index}`}>
                  <div className="overflow-hidden rounded-md">
                    <Image
                      src={city.photo ?? ""}
                      alt={city.name}
                      width={250}
                      height={200}
                      className={cn(
                        "h-auto w-auto object-cover transition-all hover:scale-105",
                        "aspect-[3/4]",
                      )}
                    />
                  </div>
                  <div className="space-y-1 text-sm" style={{ paddingTop: 4 }}>
                    <h3 className="font-medium leading-none">{city.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {city.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Attractions</h2>
            <div className="flex space-x-4 mb-4">
              <AttractionFilterComponent />
              <CityFilter />
              <RatingFilter />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="space-y-4">
                  {[
                    { name: "%ARABICA Arashiyama", desc: "A cafe with a view" },
                    { name: "Coffee Glitch Ginza", desc: "Popular coffee spot with specialty beans" },
                    { name: "Hakata Issou", desc: "美味しいラーメン" },
                  ].map((attraction, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">{attraction.name}</CardTitle>
                        <p className="text-xs text-gray-500">{attraction.desc}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-xs">
                          <span>Type: Cafe</span>
                          <span>Wait time: 1h</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Rating: Great</span>
                          <span>City: Tokyo</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <MapContainer
                  className="full-height-map"
                  center={[38, 139.69222]}
                  zoom={6}
                  minZoom={3}
                  maxZoom={19}
                  maxBounds={[[-85.06, -180], [85.06, 180]]}
                  scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  />
                  <MarkerClusterGroup>
                    {arcades.features.map((arcade, index) => (
                      <Marker
                        key={arcade.properties['@id']}
                        position={[arcade.geometry.coordinates[1], arcade.geometry.coordinates[0]]}
                      >
                        <Popup>
                          {arcade.properties.name}
                          <br />
                          {arcade.properties['name:en']}
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
});