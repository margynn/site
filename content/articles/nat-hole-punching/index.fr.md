+++
title = "P2P: trouver une porte dans le mur"
date = '2026-09-27'
draft = false
description = "..."
tags = ["p2p", "network", "go"]
toc = true
readingTime = true
+++

Quand, comme moi on vient du monde du developement Web, et que l'on s'interesse progressivement au reseau et aux systèmes distribués et décentralisés, on sort du modèle familier client-serveur pour se diriger vers le paradigme du pair-à-pair (abrégé P2P). Et en abordant ce paradigme on decouvre une série de problèmes et de contraintes nouvelles que je voudrais partager ici.

---

# Distinction Topologique

La différence entre le paradigme client-serveur et P2P est plus une distinction topologique que technique. On peut généralement utiliser, dans les deux cas, les mêmes protocoles réseau et la même infrastructure. Le bon modèle mental est qu'il s'agit d'une topologie pour les applications sur Internet.

Le modèle client-serveur est centralisé. Il suppose deux familles de participants : les clients, qui initient généralement les connexions avec les serveurs, et les serveurs, qui répondent aux communications des clients. Les clients peuvent communiquer entre eux, mais leurs communications sont généralement relayées par le serveur. C'est le modèle le plus répandu sur le Web. Quand un utilisateur ouvre une page Web avec son navigateur, il agit comme un client, qui ouvre une connexion avec un serveur (en l'occurrence le site Web). S'il communique avec d'autres clients, les communications sont généralement relayées par le serveur (par exemple dans des messageries Web comme Discord, WhatsApp ou Slack).

À l'inverse, le P2P est un modèle dans lequel les participants sont des pairs. Chaque participant peut à la fois agir comme client et comme serveur : il peut initier une connexion et accepter des connexions provenant d'autres participants. C'est particulièrement répandu dans des applications comme les systèmes distribués, les blockchains, BitTorrent ou WebRTC.

---

# Affinité réseaux du modèle client-serveur

Le modèle client-serveur présente une bonne affinité avec les contraintes des réseaux modernes. La plupart des utilisateurs d'Internet se trouvent sur des réseaux privés (par exemple sur un réseau local derrière un routeur/une box Internet). Du point de vue de l'isolation et de la sécurité, cela présente un avantage certain :

- autoriser le trafic arbitraire sortant ;
- bloquer le trafic arbitraire entrant.

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
