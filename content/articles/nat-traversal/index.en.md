+++
title = "P2P: Finding a door in the wall"
date = '2026-09-27'
description = "Why two machines on the Internet can't always talk directly, and how NAT traversal tries to solve the problem."
tags = ["P2P", "Network", "Go"]
toc = true
readingTime = true
+++

When, like me, you come from the world of Web development, and you gradually take an interest in networking and distributed/decentralized systems, you leave the familiar client-server model to head towards the peer-to-peer paradigm (abbreviated P2P). And, in approaching this paradigm, you discover a series of new problems and constraints that I'd like to share here.

{{< collapse title="Dilemma while configuring my home router" >}}
{{< imgproc "meme.jpg" Fit "800x800" center />}}
{{< /collapse >}}

---

<br>

# 1. Client-server vs P2P

The difference between the client-server and P2P paradigms is more a **topological than a technical distinction**. In both cases, you can generally use the same network protocols and the same infrastructure. The right mental model is that this is a topology for applications on the Internet.

The client-server model is centralized. It assumes two families of participants: clients, who generally initiate connections with servers, and servers, which respond to clients' communications. Clients can communicate with each other, but their communications are generally relayed by the server. This is the most widespread model on the Web. When a user opens a web page with their browser, they act as a client, which opens a connection with a server (in this case the website). If they communicate with other clients, the communications are generally relayed by the server (for example in web messaging apps like Discord, WhatsApp, or Slack).

Conversely, P2P is a model in which participants are peers. Each peer can act both as a client and as a server: it can initiate a connection and accept connections from other peers. This is particularly common in applications like distributed systems, blockchains, BitTorrent, or WebRTC.

---

<br>

# 2. The problem with private networks

"The Internet is a network of networks", and most users find themselves on private networks (e.g. home networks, corporate networks, LAN, VPN, etc.), that is, not addressable from the public Internet.
I see two main reasons for this, one security-related and one technical/historical:

## Security and isolation

Isolating devices on private networks helps prevent incoming traffic, even without explicit firewall configuration. By definition, devices on a private network are not addressable from the public Internet. This is desirable: the day my connected toaster accepts a connection from Beijing, I'll consider the network architecture a failure.

## IPv4 address exhaustion

The Internet Protocol is the protocol at the heart of data routing on the Internet. IPv4, the most widely deployed version of the IP protocol, was formalized in 1981 in [**RFC 791**](https://www.rfc-editor.org/info/rfc791).

An IPv4 address is encoded on 32 bits, which represents a range of `1<<32 = 4_294_967_296` addresses. That's about 4 billion routable IPv4 addresses on the public Internet. This is not enough to assign a unique IPv4 address to every device connected to the Internet.

{{< alert type="info" >}}
IPv6 solves this problem by using 128-bit addresses, i.e. `1<<128 ≈ 3.4×10^38` possible addresses. But since IPv6 deployment is gradual, IPv4 remains widely used.
{{< /alert >}}

The solution to IPv4 address exhaustion is described in [**RFC 1918**](https://www.rfc-editor.org/info/rfc1918) and consists of reusing IPv4 addresses on private networks without worrying about their uniqueness on a global scale. In particular, three ranges are reserved for this purpose:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

All addresses belonging to these ranges have no meaning at the global scale, they are not routed on the public Internet. As a result, two devices on distinct private networks can have the same local address. `ifconfig` lets you discover your machine's local address, here on the `en0` interface of my machine:

```bash
$ ifconfig
en0: ...
	inet 192.168.1.29 netmask 0xffffff00 broadcast 192.168.1.255
```

This address is routable within the local network. But not on the public Internet. When outgoing traffic is sent from the local network (e.g. connecting to a website), the server needs to know the source/origin address in order to respond.

This is where **Network Address Translation (NAT)** comes in. In the classic case of an IPv4 NAT, the local network's gateway translates the packet's source address and port to use its own _(public IP; public port)_ pair. The public port chosen for the translation depends on the NAT, and in principle you can't really guess it in advance.

In practice, packets may cross **several NATs across the provider's infrastructure** before reaching their destination. Each time an outgoing connection is initiated, the gateway maintains a mapping between the private endpoint and the public endpoint. Every packet sent over this connection has its origin/source translated on the fly by the NAT.

---

<br>

# 3. P2P is different

In the client-server model, NAT doesn't cause problems because the server is publicly routable: it is accessible on the public Internet. Once the connection is initiated by the client (e.g. a device on the private/local network), the NAT records the _(private IP; private port)_ <-> _(public IP; public port)_ mapping, the server can then respond and the NAT performs the translation and forwards to the associated device on the private network.

In the P2P model, NAT becomes a problem when both peers are each behind a NAT. Neither peer is directly reachable because neither NAT holds the _(private IP; private port)_ <-> _(public IP; public port)_ mapping.

Moreover, the peers themselves don't know their own _(public IP; public port)_: this information is maintained by their respective NAT. Neither of them can therefore simply initiate a connection to the other the way it would with a publicly addressable server.

---

<br>

# 4. Discovering your public address with STUN

The first step in attempting to traverse NAT is to find out the _(public IP; public port)_ resolution performed by the NAT. This information is needed by the remote peer to route its packets. [**RFC 8489**](https://www.rfc-editor.org/info/rfc8489/) defines a suite of tools for NAT traversal. The abstract states:

> "Session Traversal Utilities for NAT (STUN) is a protocol that serves
> as a tool for other protocols in dealing with NAT traversal. It can
> be used by an endpoint to determine the IP address and port allocated
> to it by a NAT. "

This RFC defines a single method: `Binding` (the "message type" field of the header also encodes a class: request, success, error, or indication, but only one exchange type interests us here: the `Binding` request and its response). What interests us for resolving the NAT's _(public IP; public port)_ is decoding the `XOR-MAPPED-ADDRESS` attribute of the response. This attribute contains the client's public address as seen by the STUN server, i.e. after translation by the last NAT crossed.

{{< collapse title="STUN message binary format" >}}

STUN header:

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

STUN attribute:

```txt
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |         Type                  |            Length             |
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |                         Value (variable)                ....
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

`XOR-MAPPED-ADDRESS` attribute:

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

The good news is that Google freely provides STUN servers for WebRTC projects. For example: `stun.l.google.com:19302`.

{{< collapse title="Go example" >}}

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
This demo deliberately simplifies STUN: the `bindingRequest`'s Transaction ID is left at zero, when it should be drawn randomly and then checked in the response (to reject responses that don't match the request). Errors from `Dial`, `Write`, and `Read` are also ignored, which is only acceptable for a demonstration.
{{< /alert >}}

Running this several times in a row, we can see that the IP stays fixed but the port changes:

```sh
$ go run .
2026/09/27 23:38:53 NAT: 82.67.x.x:55945

$ go run .
2026/09/27 23:41:21 NAT: 82.67.x.x:57853

$ go run .
2026/09/27 23:41:23 NAT: 82.67.x.x:55655
```

In my particular case I have a fixed IP with my ISP, which explains why it doesn't vary from one run to another; the port, on the other hand, changes because it's the NAT that dynamically chooses the translation for each new connection initiated by the Go program.

{{< alert type="warning" >}}
Does this address depend on the destination contacted? For most NATs, no, the mapping only depends on _(private IP; private port)_. But some NATs (called **symmetric**) assign a different translation per destination: the address seen by the peer would then be different. I come back to this in part 6.
{{< /alert >}}

---

<br>

# 5. NAT hole punching

To summarize the pieces assembled so far:

- The NAT translates the origin of packets from the private network and rejects incoming packets that don't match any mapping.
- STUN lets you obtain the public address and port of the last NAT hop taken.

We can therefore sketch out the following protocol to try to punch through NATs and allow two peers, each behind a NAT, to communicate:

1. Each peer resolves its public addressing with STUN.
   In doing so, each NAT will record a _private<->public_ mapping
2. Each peer exchanges its public addressing with the other.
   The mechanism doesn't matter much, there can be a public rendezvous server.
3. On the **same connection** used to contact the STUN server, the peers
   send packets to the other's public address
4. Profit ??

One last piece is missing: the network protocol used. On the Internet, the two main network protocols encountered are TCP and UDP. Each offers different deliverability and ordering guarantees.

**TCP:** Provides a reliable, ordered byte stream between the two endpoints: TCP internally handles retransmissions and reordering, the application only sees a continuous stream. If `A` successfully writes bytes `1,2,3` then `4,5,6`, `B` is guaranteed to read them in that order, but with no guarantee that they arrive chunked the same way. TCP is said to be "stateful", because each endpoint must maintain connection state with the remote peer. A TCP socket is entirely defined by _(local IP, local port, remote IP, remote port)_. It only receives data from a single sender.

**UDP:** Does not guarantee packet deliverability, nor their order of receipt. It's a more optimistic and simplistic protocol than TCP. UDP is stateless, the sender never receives any acknowledgment. UDP does however preserve datagram boundaries: each `WriteToUDP` corresponds to one `ReadFromUDP` on the receiving side. A UDP socket is entirely defined by _(local IP, local port)_. It can receive packets from several different senders.

In Go:

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

In the case of UDP, `conn` will create a single NAT mapping, whether it talks to `A` or `B` (in the case of a full-cone NAT). The benefit is huge: once the mapping is established with a STUN request, it can be reused, in UDP, to map incoming traffic to the right socket.

---

<br>

# 6. Demonstration

{{< collapse title="NAT hole punching in Go" >}}

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
# Local machine on my mobile network
~/Development/NAT go run .
2026/09/29 11:49:24 local: 0.0.0.0:60963
2026/09/29 11:49:25 public: 78.240.119.118:15070 # NAT mapping
peer: 82.67.x.x:49190 # "Rendezvous"

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
# Remote machine behind my home NAT
martin@vestige:~/Dev/NAT $ go run .
2026/09/29 09:49:23 local: 0.0.0.0:49190
2026/09/29 09:49:23 public: 82.67.x.x:49190 # NAT mapping
peer: 78.240.119.118:15070 # "Rendezvous"

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

The punching works! After the STUN discovery, I share the peer's public address with the other one manually. From there each side sends and receives data from the remote peer.

---

<br>

# 7. Limitations

NAT hole punching is not, however, always possible. Saying that a NAT mapping redirects incoming traffic to the right device was a simplification: the router can also filter packets based on where they come from.

There was also a blind spot in the procedure described above. If the NAT accepts packets from any origin, any peer who knows the public address and port can write to the local peer. It's up to the application to filter packets. This is however probably not the most reliable network isolation strategy.

It's certainly less critical than opening every port on your router and exposing your entire private network to the public Internet. But in contexts where network isolation is critical (e.g. corporate networks), this is not acceptable.

NATs actually have two independent decisions to make: which public port to assign to an outgoing flow, and which incoming packets to accept on that port. There are several NAT behaviors, among them:

- **Full-cone:** the assigned public port doesn't depend on the destination, and once the mapping is created, any peer can send it UDP packets to the public address and port discovered via STUN. The punching described above then works.
- **(Port-)restricted cone:** the assigned public port also doesn't depend on the destination, but the NAT does more than just translate: it also filters incoming packets and only accepts those coming from an IP (and, for port-restricted, a port) already contacted from this mapping. The punching still works, provided each peer has first sent an outgoing packet to the other — that's the role of the repeated hole-punching packets.
- **Symmetric:** this time the assigned public port does depend on the destination. The port discovered by the STUN server may be different from the one used to reach the other peer. Sharing that port with them isn't enough to punch through the NAT.

Then, the firewall can still add its own rules and block incoming UDP packets, possibly depending on their origin. On home networks, NAT punching is generally feasible (notably to enable P2P applications, online games, and others).

In cases where NAT hole punching isn't possible, there's a fallback solution: TURN [**RFC 8656**](https://www.rfc-editor.org/info/rfc8656/). Both peers each establish an outgoing connection to a relay server, which relays their packets. TURN works as long as both peers can reach the relay (which is generally directly addressable). The trade-off is the high bandwidth cost on the relay server and possibly additional latency since the traffic passes through an intermediary.
