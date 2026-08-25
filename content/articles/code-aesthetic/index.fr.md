+++
title = "Code Aesthetic à l'ère de l'IA"
date = '2026-08-25'
draft = true
description = "..."
tags = ["code"]
toc = true
readingTime = true
+++

J'avais commencé à lire Clean Code de Robert C. Martin, il y a qq années. J'ai jamais terminé de le lire (j'ai du m'arreter à la moitié), mais j'avais trouvé à l'époque des idées et intuitions tres pratique pour améliorer la lisibilité de mon code. En particulier:

- Le nommage: explicite et intentionel
- La taille des fonctions: courte et mono-responsable
- La structure: DRY
- Les commentaires: peu ou pas, seulement pour le "pourquoi"
- La gestion d'erreur comme comportement normal du programme

Robert C. Martin ne fait pas l'unnanimité. Outre l'orgueil du bonhomme, je pense que c'est principalement car ses conseils sont formulé comme de dogmes, par example: la taille maximale des fonctions, ou le nombre maximale de parametre par fonction, ou bien le niveaux d'imbrication etc...

Il donne une dimension presque sacrale à la façon d'écrire du code. Et puis, c'est bon pour le business puisqu'il vient ensuite vous vendre des livres et formations pour vous expliquer comment devenir un artisan du code. pratique.

Bon, c'est amusant et sans incidence, mais il y a quand meme de une idée simple et puissante qui se dégage de Clean Code:

Le code est lu beaucoup plus souvent qu'il n'est écrit, et la lisibilité est une propriété technique, pas seulement esthétique.

TODO: explique la propriété technique.

Il est si facile d'oublier que l'on ecrit pas le code pour la machine mais pour l'humain. Toutes les abstractions que l'on construit elles sont pour nous, pas pour elles. Écrire du code c'est toujours un arbitrage entre spécifier ce que la machine doit faire et egalement communiquer cette intention au prochain humain qui devra le lire.

On pourrait penser qu'avec les coding agents on est completement sortis de cela. Mais je ne pense pas. D'abord les LLM ont été entrainé sur du code écrit par des humains, donc

TODO: source + IA symbolique / generation de texte

---

todo:

- partager les videos de code aesthetique - montrer qq examples (plutot en fin d'article)
-
