+++
title = "P2P: Trouver une porte dans le mur"
date = '2026-09-27'
draft = false
description = "Pourquoi deux machines sur Internet ne peuvent pas toujours se parler directement, et comment le NAT traversal tente de résoudre le problème."
tags = ["P2P", "Réseau", "Go"]
toc = true
readingTime = true
+++

Quand, comme moi, on vient du monde du développement Web, et que l'on s'intéresse progressivement au réseau et aux systèmes distribués et décentralisés, on sort du modèle familier client-serveur pour se diriger vers le paradigme du pair-à-pair (abrégé P2P). Et, en abordant ce paradigme on découvre une série de problèmes et de contraintes nouvelles que je voudrais partager ici.

{{< collapse title="Dilemme lors de la configuration de mon routeur domestique" >}}
{{< imgproc "meme.jpg" Fit "800x800" center />}}
{{< /collapse >}}

---

<br>

# 1. Client-serveur vs P2P

La différence entre le paradigme client-serveur et P2P est plus une **distinction topologique que technique**. On peut généralement utiliser, dans les deux cas, les mêmes protocoles réseau et la même infrastructure. Le bon modèle mental est qu'il s'agit d'une topologie pour les applications sur Internet.

Le modèle client-serveur est centralisé. Il suppose deux familles de participants : les clients, qui initient généralement les connexions avec les serveurs, et les serveurs, qui répondent aux communications des clients. Les clients peuvent communiquer entre eux, mais leurs communications sont généralement relayées par le serveur. C'est le modèle le plus répandu sur le Web. Quand un utilisateur ouvre une page Web avec son navigateur, il agit comme un client, qui ouvre une connexion avec un serveur (en l'occurrence le site Web). S'il communique avec d'autres clients, les communications sont généralement relayées par le serveur (par exemple dans des messageries Web comme Discord, WhatsApp ou Slack).

À l'inverse, le P2P est un modèle dans lequel les participants sont des pairs. Chaque pair peut à la fois agir comme client et comme serveur : il peut initier une connexion et accepter des connexions provenant d'autres pairs. C'est particulièrement répandu dans des applications comme les systèmes distribués, les blockchains, BitTorrent ou WebRTC.

---

<br>

# 2. Le problème des réseaux privés

"Internet est un réseau de réseaux", et la plupart des utilisateurs se trouvent dans des réseaux privés (eg. réseaux domestiques, d'entreprise, LAN, VPN etc.), c'est-à-dire non adressable depuis l'Internet public.
Je vois deux raisons principales à cela, une sécuritaire et une technique/historique:

## Sécurité et isolation

L'isolation d'équipements dans des réseaux privés permet d'éviter le trafic entrant, même sans configuration explicite de pare-feu. Par définition, les équipements d'un réseau privé ne sont pas adressables depuis l'Internet public. C'est souhaitable: le jour où mon grille-pain connecté accepte une connexion depuis Pékin, je considère que l'architecture réseau a échoué.

## Épuisement des adresses IPv4

L'Internet Protocol est le protocole au cœur du routage des données sur Internet. IPv4, version du protocole IP le plus déployé, a été formalisé en 1981 dans la [**RFC 791**](https://www.rfc-editor.org/info/rfc791).

Une adresse IPv4 est encodée sur 32 bits, ça représente une plage de `1<<32 = 4_294_967_296` adresses. C'est-à-dire environ 4 milliards d'adresses IPv4 routables sur l'Internet public. C'est insuffisant pour attribuer une adresse IPv4 unique à chaque équipement connecté à Internet.

{{< alert type="info" >}}
IPv6 résout ce problème en utilisant des adresses de 128 bits, soit `1<<128 ≈ 3,4×10^38` adresses possibles. Mais le déploiement d'IPv6 étant progressif, IPv4 reste largement utilisé.
{{< /alert >}}

La solution à l'épuisement d'adresse IPv4 est décrite dans [**RFC 1918**](https://www.rfc-editor.org/info/rfc1918) et consiste à réutiliser des adresses IPv4 dans des réseaux privés sans se soucier de leur unicité à l'échelle mondiale. En particulier trois plages sont réservées à cet usage:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

Toutes les adresses qui appartiennent à ces plages n'ont aucune signification à l'échelle globale, elles ne sont pas routées sur l'Internet public. En conséquence, deux équipements sur des réseaux privés distincts peuvent avoir la même adresse locale. `ifconfig` permet de découvrir l'adresse locale de sa machine, ici sur l'interface `en0` de ma machine:

```bash
$ ifconfig
en0: ...
	inet 192.168.1.29 netmask 0xffffff00 broadcast 192.168.1.255
```

Cette adresse est routable dans le réseau local. Mais pas dans l'Internet public. Lorsque du trafic sortant est émis depuis le réseau local (eg. se connecter à un site web), le serveur doit connaitre l'adresse source/d'origine pour répondre.

C'est là qu'intervient le **Network Address Translation (NAT)**. Dans le cas classique d'un NAT IPv4, la passerelle du réseau local traduit l'adresse et le port source du paquet pour utiliser son propre couple _(IP publique ; port public)_. Le port public choisi pour la traduction dépend du NAT, en principe on ne peut pas vraiment le deviner à l'avance.

En pratique, les paquets peuvent traverser **plusieurs NAT sur l'infrastructure du fournisseur** avant d'atteindre leur destination. À chaque fois qu'une connexion sortante est initiée, la passerelle maintient un mappage entre l'extrémité privée et l'extrémité publique. Chaque paquet envoyé sur cette connexion voit son origine/source traduite à la volée par le NAT.

---

<br>

# 3. Le P2P est différent

Dans le modèle client-serveur, le NAT ne pose pas de soucis car le serveur est publiquement routable : il est accessible sur l'Internet public. Une fois que la connexion est initiée par le client (eg. un équipement du réseau privé/local) le NAT enregistre le mappage _(IP privée ; port privé)_ <-> _(IP publique ; port public)_, le serveur peut ensuite répondre et le NAT effectue la traduction et transmet à l'équipement associé du réseau privé.

Dans le modèle P2P, le NAT pose problème dans le cas où les deux pairs sont chacun derrière un NAT. Aucun des pairs n'est directement accessible car aucun des NAT ne contient le mappage _(IP privée ; port privé)_ <-> _(IP publique ; port public)_.

D'ailleurs les pairs eux-mêmes ne connaissent pas leur _(IP publique ; port public)_ : cette information est maintenue par leur NAT respectif. Aucun des deux ne peut donc simplement initier une connexion vers l'autre comme il le ferait avec un serveur publiquement adressable.

---

<br>

# 4. Découvrir son adresse publique avec STUN

La première étape pour tenter de traverser le NAT c'est de connaitre la résolution _(IP publique ; port public)_ effectuée par le NAT. Cette information est nécessaire pour le pair distant pour router ses paquets. La [**RFC 8489**](https://www.rfc-editor.org/info/rfc8489/) définit une suite d'outils pour traverser un NAT. L'abstract indique :

> "Session Traversal Utilities for NAT (STUN) is a protocol that serves
> as a tool for other protocols in dealing with NAT traversal. It can
> be used by an endpoint to determine the IP address and port allocated
> to it by a NAT. "

Cette RFC définit une seule méthode: `Binding` (le champ "type de message" du header encode aussi une classe : requête, succès, erreur ou indication, mais un seul type d'échange nous intéresse ici : la requête `Binding` et sa réponse). Ce qui nous intéresse pour la résolution _(IP publique ; port public)_ du NAT c'est de décoder l'attribut `XOR-MAPPED-ADDRESS` de la réponse. Cet attribut contient l'adresse publique du client telle que vue par le serveur STUN, c'est-à-dire après traduction par le dernier NAT traversé.

{{< collapse title="Format binaire des messages STUN" >}}

En-tête STUN :

```txt
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |0 0|     STUN Message Type     |         Message Length        |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |                   Magic Cookie:  0x2112A442                   |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |                                                               |
     |                     Transaction ID (96 bits)                  |
     |                                                               |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Attribut STUN :

```txt
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |         Type                  |            Length             |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |                         Value (variable)                ....
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Attribut `XOR-MAPPED-ADDRESS` :

```txt
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |0 0 0 0 0 0 0 0|    Family     |         X-Port                |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |                X-Address (Variable)                           |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

{{< /collapse >}}

Une bonne nouvelle c'est que Google met gratuitement à disposition des serveurs STUN pour les projets WebRTC. Par exemple: `stun.l.google.com:19302`.

{{< collapse title="Example Go" >}}

```go
// main.go
package main

import (
   "log"
	"net"
	"encoding/binary"
	"errors"
	"net/netip"
)

func main() {
	conn, _ := net.Dial("udp4", stunServer)
	conn.Write(bindingRequest[:])
	buf := make([]byte, 1<<16)
	n, _ := conn.Read(buf)
	public, _ := getAddress(buf[:n])
	log.Printf("NAT: %v:%v\n", public.Addr(), public.Port())
}

/* STUN Parsing */

const (
	headerLen  = 20
	cookie     = uint32(0x2112A442)
	stunServer = "stun.l.google.com:19302"
)

var bindingRequest = [headerLen]byte{
	0x00, 0x01, // binding request
	0x00, 0x00, // no attributes
	0x21, 0x12, 0xA4, 0x42, // cookie
}

func isSTUNMessage(b []byte) bool {
	return len(b) >= headerLen &&
		b[0]&0b1100_0000 == 0 && // STUN type starts with 00
		binary.BigEndian.Uint32(b[4:8]) == cookie &&
		int(binary.BigEndian.Uint16(b[2:4])) <= len(b)-headerLen
}

func getAddress(b []byte) (netip.AddrPort, error) {
	if !isSTUNMessage(b) {
		return netip.AddrPort{}, errors.New("invalid STUN message")
	}

	n := int(binary.BigEndian.Uint16(b[2:4]))
	for b = b[headerLen : headerLen+n]; len(b) >= 4; {
		typ := binary.BigEndian.Uint16(b[:2])
		n := int(binary.BigEndian.Uint16(b[2:4]))
		b = b[4:]

		if n > len(b) {
			break
		}
		if typ == 0x0020 && n >= 8 && b[1] == 1 {
			port := binary.BigEndian.Uint16(b[2:4]) ^ uint16(cookie>>16)
			// XOR IP with magic number
			ip := [4]byte{
				b[4] ^ 0x21,
				b[5] ^ 0x12,
				b[6] ^ 0xA4,
				b[7] ^ 0x42,
			}
			return netip.AddrPortFrom(netip.AddrFrom4(ip), port), nil
		}

		n = (n + 3) &^ 3 // Attribute values are padded to 32 bits.
		if n > len(b) {
			break
		}
		b = b[n:]
	}

	return netip.AddrPort{}, errors.New("address not found")
}
```

{{< /collapse >}}

{{< alert type="warning" >}}
Cette démo simplifie volontairement STUN : le Transaction ID de `bindingRequest` est laissé à zéro, alors qu'il devrait être tiré aléatoirement puis vérifié dans la réponse (pour rejeter les réponses qui ne correspondent pas à la requête). Les erreurs de `Dial`, `Write` et `Read` sont aussi ignorées, ce qui n'est acceptable que pour une démonstration.
{{< /alert >}}

En relançant l'exécution plusieurs fois de suite on voit que l'IP reste fixe mais le port change :

```sh
$ go run .
2026/09/27 23:38:53 NAT: 82.67.x.x:55945

$ go run .
2026/09/27 23:41:21 NAT: 82.67.x.x:57853

$ go run .
2026/09/27 23:41:23 NAT: 82.67.x.x:55655
```

Dans mon cas particulier j'ai une IP fixe auprès de mon FAI, ce qui explique qu'elle ne varie pas d'un run à l'autre ; le port, lui, change car c'est le NAT qui choisit dynamiquement la traduction à chaque nouvelle connexion initiée par le programme Go.

{{< alert type="warning" >}}
Cette adresse dépend-elle de la destination contactée ? Pour la plupart des NAT non, le mapping ne dépend que de _(IP privée ; port privée)_. Mais certains NAT (dits **symétriques**) attribuent une traduction différente par destination : l'adresse vue par le pair serait alors différente. J'y reviens en partie 6.
{{< /alert >}}

---

<br>

# 5. Percement de NAT

Si on résume les pièces assemblées :

- Le NAT traduit l'origine des paquets du réseau privé et rejette les paquets entrants qui ne correspondent à aucun mappage.
- STUN permet d'obtenir l'adresse et le port publics du dernier NAT emprunté.

On peut donc esquisser le protocole suivant pour tenter de percer les NAT et permettre à deux pairs, chacun derrière un NAT, de pouvoir communiquer :

1. Chaque pair résout son adressage public avec STUN.
   Ce faisant, chaque NAT va enregistrer un mappage _privé<->public_
2. Chaque pair échange son adressage public avec l'autre.
   Le mécanisme importe peu, il peut y avoir un serveur de rendez-vous public.
3. Sur la **même connexion** que pour contacter le serveur STUN, les pairs
   envoient des paquets vers l'adresse publique de l'autre
4. Profit ??

Il manque un dernier élément : le protocole réseau utilisé. Sur Internet les deux principaux protocoles réseau rencontrés sont TCP et UDP. Chacun offre des garanties de délivrabilité et d'ordonnancement différentes.

**TCP :** Fournit un flux d'octets fiable et ordonné entre les deux extrémités : TCP gère en interne les retransmissions et le réordonnancement, l'application ne voit qu'un flux continu. Si `A` écrit avec succès les octets `1,2,3` puis `4,5,6`, `B` est garanti de les lire dans cet ordre, mais sans garantie qu'ils arrivent découpés de la même façon. TCP est dit "avec état", car chaque extrémité doit maintenir un état de connexion avec le pair distant. Une socket TCP est définie entièrement par _(IP locale, port local, IP distante, port distant)_. Elle ne reçoit des données que d'un seul expéditeur

**UDP :** Ne garantit pas la délivrabilité des paquets, ni leur ordre de réception. C'est un protocole plus optimiste et simpliste que TCP. UDP est sans état, l'émetteur ne reçoit jamais de confirmation de réception. UDP conserve en revanche les frontières des datagrammes : chaque `WriteToUDP` correspond à un `ReadFromUDP` côté récepteur. Une socket UDP est définie entièrement par _(IP locale, port local)_. Elle peut recevoir des paquets de plusieurs expéditeurs différents.

En Go :

```go
func tcp() {
	conn, err := net.Dial("tcp", "1.2.3.4:443")
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	_, _ = conn.Write([]byte("hello"))
}

func udp() {
	// port 0 -> let the OS choose the port
	conn, err := net.ListenUDP("udp", &net.UDPAddr{Port: 0})
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	a := &net.UDPAddr{IP: net.ParseIP("1.2.3.4"), Port: 5000}
	b := &net.UDPAddr{IP: net.ParseIP("5.6.7.8"), Port: 6000}

	_, _ = conn.WriteToUDP([]byte("hello A"), a)
	_, _ = conn.WriteToUDP([]byte("hello B"), b)
}
```

Dans le cas de UDP `conn` créera un seul mappage NAT, qu'il communique avec `A` ou `B` (dans le cas d'un NAT full-cone). L'intérêt est immense : une fois le mappage réalisé avec une requête STUN, on peut le réutiliser, en UDP, pour mapper le trafic entrant vers la bonne socket.

---

<br>

# 6. Démonstration

{{< collapse title="Percement NAT en Go" >}}

```go
func main() {
	conn, _ := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4zero})
	defer conn.Close()

	log.Printf("local: %v", conn.LocalAddr())

	// Discover public endpoint
	stun, _ := net.ResolveUDPAddr("udp4", "stun.l.google.com:19302")
	conn.WriteToUDP(bindingRequest[:], stun)
	buf := make([]byte, 1500)
	n, _, _ := conn.ReadFromUDP(buf)
	public, _ := getAddress(buf[:n])

	log.Printf("public: %v", public)

	// Enter peer's public endpoint
	fmt.Print("peer: ")
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()

	peer, err := net.ResolveUDPAddr("udp4", scanner.Text())
	if err != nil {
		log.Fatal(err)
	}

	// Receive packets from the peer.
	go func() {
		buf := make([]byte, 1500)
		for {
			n, addr, _ := conn.ReadFromUDP(buf)
			log.Printf("[%v] <- %v: %s", public, addr, buf[:n])
		}
	}()

	// Repeatedly send packets to the peer.
	// Both peers do this simultaneously: this is the hole punching.
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for range ticker.C {
		n := rand.Intn(1000)
		msg := strconv.Itoa(n)
		_, _ = conn.WriteToUDP([]byte(msg), peer)
		log.Printf("[%v] -> %v: %s", public, peer, msg)
	}
}
```

{{< /collapse >}}

```sh
# Machine local sur mon réseau mobile
~/Development/NAT go run .
2026/09/29 11:49:24 local: 0.0.0.0:60963
2026/09/29 11:49:25 public: 78.240.119.118:15070 # Mappage NAT
peer: 82.67.x.x:49190 # "Rendez-vous"

2026/09/29 11:49:38 [78.240.119.118:15070] -> 82.67.x.248:49190: 817
2026/09/29 11:49:39 [78.240.119.118:15070] <- 82.67.x.248:49190: 180
2026/09/29 11:49:39 [78.240.119.118:15070] -> 82.67.x.248:49190: 656
2026/09/29 11:49:40 [78.240.119.118:15070] <- 82.67.x.248:49190: 562
2026/09/29 11:49:40 [78.240.119.118:15070] -> 82.67.x.x:49190: 439
2026/09/29 11:49:41 [78.240.119.118:15070] <- 82.67.x.x:49190: 975
2026/09/29 11:49:41 [78.240.119.118:15070] -> 82.67.x.x:49190: 725
2026/09/29 11:49:42 [78.240.119.118:15070] <- 82.67.x.x:49190: 511
2026/09/29 11:49:42 [78.240.119.118:15070] -> 82.67.x.x:49190: 378
2026/09/29 11:49:43 [78.240.119.118:15070] <- 82.67.x.x:49190: 893
2026/09/29 11:49:43 [78.240.119.118:15070] -> 82.67.x.x:49190: 459
2026/09/29 11:49:44 [78.240.119.118:15070] <- 82.67.x.x:49190: 691
2026/09/29 11:49:44 [78.240.119.118:15070] -> 82.67.x.x:49190: 196
```

```sh
# Machine remote derrière mon NAT domestique
martin@vestige:~/Dev/NAT $ go run .
2026/09/29 09:49:23 local: 0.0.0.0:49190
2026/09/29 09:49:23 public: 82.67.x.x:49190 # Mappage NAT
peer: 78.240.119.118:15070 # "Rendez-vous"

2026/09/29 09:49:39 [82.67.x.x:49190] -> 78.240.119.118:15070: 180
2026/09/29 09:49:39 [82.67.x.x:49190] <- 78.240.119.118:15070: 656
2026/09/29 09:49:40 [82.67.x.x:49190] -> 78.240.119.118:15070: 562
2026/09/29 09:49:40 [82.67.x.x:49190] <- 78.240.119.118:15070: 439
2026/09/29 09:49:41 [82.67.x.x:49190] -> 78.240.119.118:15070: 975
2026/09/29 09:49:41 [82.67.x.x:49190] <- 78.240.119.118:15070: 725
2026/09/29 09:49:42 [82.67.x.x:49190] -> 78.240.119.118:15070: 511
2026/09/29 09:49:42 [82.67.x.x:49190] <- 78.240.119.118:15070: 378
2026/09/29 09:49:43 [82.67.x.x:49190] -> 78.240.119.118:15070: 893
2026/09/29 09:49:43 [82.67.x.x:49190] <- 78.240.119.118:15070: 459
2026/09/29 09:49:44 [82.67.x.x:49190] -> 78.240.119.118:15070: 691
2026/09/29 09:49:45 [82.67.x.x:49190] <- 78.240.119.118:15070: 196
2026/09/29 09:49:45 [82.67.x.x:49190] -> 78.240.119.118:15070: 131
```

Le perçage fonctionne ! Après la decouverte STUN, je partage l'addresse publique du pair avec l'autre manuellement. À partir de la chacun envoit et recoit de la data de la part du pair distant.

---

<br>

# 7. Limites

Le percement de NAT n’est cependant pas toujours possible. Dire qu’un mappage NAT redirige le trafic entrant vers le bon équipement était une simplification : le routeur peut aussi filtrer les paquets selon leur provenance.

Il y avait aussi un angle mort dans la procédure décrite plus haut. Si le NAT accepte les paquets de n’importe quelle provenance, tout pair connaissant l’adresse et le port publics peut écrire au pair local. À l’application de filtrer les paquets. Cependant, c'est sans doute pas la strategie d'isolation réseau la plus fiable.

C'est certainement moins critique que d'ouvrir tous les ports de son routeur et d'exposer l'intégralité du réseau privé sur l'Internet public. Mais dans des contextes où l'isolation réseaux est critique (type réseaux d'entreprise), ce n'est pas acceptable.

Les NAT ont en réalité deux décisions indépendantes à prendre : quel port public attribuer à un flux sortant, et quels paquets entrants accepter sur ce port. Il existe plusieurs comportements de NAT, parmi :

- **Full-cone :** le port public attribué ne dépend pas de la destination, et une fois le mappage créé, n’importe quel pair peut lui envoyer des paquets UDP vers l’adresse et le port publics découverts via STUN. Le percement décrit plus haut fonctionne alors.
- **(Port-)restricted cone :** le port public attribué ne dépend pas non plus de la destination, mais le NAT ne fait pas que traduire : il filtre aussi les paquets entrants et n'accepte que ceux provenant d'une IP (et, pour port-restricted, d'un port) déjà contactée depuis ce mappage. Le percement fonctionne toujours, à condition que chaque pair ait d'abord envoyé un paquet sortant vers l'autre — c'est le rôle des paquets répétés du hole punching.
- **Symétrique :** le port public attribué dépend cette fois de la destination. Le port découvert par le serveur STUN peut être différent de celui utilisé pour joindre l’autre pair. Lui transmettre ce port ne suffit pas pour percer le NAT.

Ensuite, le pare-feu peut encore ajouter ses propres règles et bloquer les paquets UDP entrants, possiblement en fonction de leur origine. Sur les réseaux domestiques, le percement de NAT est généralement réalisable (pour permettre notamment les applications P2P, les jeux en réseau et autres).

Dans les cas où le percement de NAT n'est pas possible, il y a une solution de repli : TURN [**RFC 8656**](https://www.rfc-editor.org/info/rfc8656/). Les deux pairs établissent chacun une connexion sortante vers un serveur relais, qui relaie leurs paquets. TURN fonctionne si les deux pairs peuvent joindre le relais (générallement directement addressable). La contrepartie est le coût élevé en bande passante sur le serveur relais et possiblement des latences supplémentaires puisque le trafic passe par un intermédiaire.
