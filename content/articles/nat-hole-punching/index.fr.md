+++
title = "P2P: Trouver une porte dans le mur"
date = '2026-09-27'
draft = false
description = "Pourquoi deux machines sur Internet ne peuvent pas toujours se parler directement, et comment le NAT traversal tente de résoudre le problème."
tags = ["P2P", "Réseau", "Go"]
toc = true
readingTime = true
+++

Quand, comme moi, on vient du monde du developement Web, et que l'on s'interesse progressivement au reseau et aux systèmes distribués et décentralisés, on sort du modèle familier client-serveur pour se diriger vers le paradigme du pair-à-pair (abrégé P2P). Et, en abordant ce paradigme on decouvre une série de problèmes et de contraintes nouvelles que je voudrais partager ici.

{{< debugres >}}

---

<br>

# 1. Client-serveur vs P2P

La différence entre le paradigme client-serveur et P2P est plus une **distinction topologique que technique**. On peut généralement utiliser, dans les deux cas, les mêmes protocoles réseau et la même infrastructure. Le bon modèle mental est qu'il s'agit d'une topologie pour les applications sur Internet.

Le modèle client-serveur est centralisé. Il suppose deux familles de participants : les clients, qui initient généralement les connexions avec les serveurs, et les serveurs, qui répondent aux communications des clients. Les clients peuvent communiquer entre eux, mais leurs communications sont généralement relayées par le serveur. C'est le modèle le plus répandu sur le Web. Quand un utilisateur ouvre une page Web avec son navigateur, il agit comme un client, qui ouvre une connexion avec un serveur (en l'occurrence le site Web). S'il communique avec d'autres clients, les communications sont généralement relayées par le serveur (par exemple dans des messageries Web comme Discord, WhatsApp ou Slack).

À l'inverse, le P2P est un modèle dans lequel les participants sont des pairs. Chaque participant peut à la fois agir comme client et comme serveur : il peut initier une connexion et accepter des connexions provenant d'autres participants. C'est particulièrement répandu dans des applications comme les systèmes distribués, les blockchains, BitTorrent ou WebRTC.

---

<br>

# 2. Le problème des réseaux privés

"Internet est un réseau de réseaux", et la pluparts des utilisateurs se trouvent dans des réseaux privés (eg. reseaux domestique, d'entreprise, LAN, VPN etc...), c'est à dire non-addressable depuis l'Internet publique.
Je vois deux raisons principales a cela, une securitaire et une technique/historique:

## Sécurité et isolation

L'isolation d'équipements dans des reseaux privés permet d'eviter le traffic entrant, même sans configuration explicite de parefeux. Par définition, les equipements d'un réseaux privé ne sont pas addressable depuis l'Internet publique. C'est souhaitable: le jour où mon grille pain connecté recoit une connection TCP depuis Pékin, je considère que l'architecture réseau a échoué.

## Épuisement des addresses IPv4

L'Internet Protocol, est le protocole au coeur du routage des données sur Internet. IPv4, version du protocol IP le plus deployé, a été formalisé en 1981 dans la [`RFC 791`](https://datatracker.ietf.org/doc/html/rfc791).

Une addresse IPv4 est encodé sur 32 bits, ça représente une plage de `1<<32 = 4_294_967_296` addresses. C'est-à-dire environ 4 Milliards d'addresses IPv4 routable sur l'Internet publique. C'est insufisant pour attribuer une addresse IPv4 unique a chaque équipement connecté à Internet.

{{< alert type="info" >}}
IPv6 résout ce problème en utilisant des adresses de 128 bits, soit `1<<128 ≈ 3,4×10^38` adresses possibles. Mais le déploiement d'IPv6 étant progressif, IPv4 reste largement utilisé.
{{< /alert >}}

La solution à l'épuisement d'addresse IPv4 est décrite dans [`RFC 1918`](https://datatracker.ietf.org/doc/html/rfc1918) et consiste à reutiliser des addresses IPv4 dans des reseaux privés sans se soucier de leur unicité à l'échelle mondiale. En particulier trois plages sont réservées à cet usage:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

Toutes les addresses qui appartiennent à ces plages n'ont aucune signification a l'échelle globale, elles ne sont pas routées sur l'Internet public. En conséquence, deux équipements sur des reseaux privés distinct peuvent avoir la même addresse locale. `ifconfig` permet de decouvrir l'addresse locale de sa machine, ici sur l'interface `en0` de ma machine:

```sh
$ ifconfig
en0: ...
	inet 192.168.1.29 netmask 0xffffff00 broadcast 192.168.1.255
```

Cette addresse est routable/atteignable dans le reseaux local. Mais pas dans l'Internet publique. Lorsque du traffic sortant est émis depuis le réseaux local (eg. se connecter à une page web), le router fait

# 3. Le P2P est différent

# 4. Découvrir son adresse publique avec STUN

# 5. UDP hole punching

# 6. Limites

# 8. Implémentation Go

---

sujet:
Nat, udp/tcp, ipv4/ipv6

```txt

Two Buttons
« Autoriser tout le trafic entrant » / « Rester derrière le NAT »


1. Client-serveur vs P2P
   └── distinction topologique

2. Le problème des réseaux privés
   ├── NAT
   ├── firewall
   └── pourquoi client-serveur fonctionne naturellement

3. Pourquoi le P2P est différent
   └── A veut contacter B, mais B n'est pas directement joignable

4. Découvrir son adresse publique avec STUN

5. UDP hole punching
   ├── principe
   ├── échange des endpoints
   └── établissement du chemin direct

6. Limites
   ├── types de NAT
   ├── firewalls
   └── cas où le punching échoue

7. TURN : le fallback
   └── relayer le trafic quand le P2P direct est impossible

8. Implémentation Go
   └── petite démo concrète
```
