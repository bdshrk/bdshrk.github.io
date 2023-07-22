---
layout: default
title: Unity Tripod Attack
splash: /assets/tripod/splash.png
parent: Portfolio
nav_order: 100
---

# Tripod Attack (Unity Horror Game)

**3D Unity Horror Game based on the War of the Worlds®**

<video controls autoplay muted loop>
	<source src="/assets/tripod/trailer.mp4" type="video/mp4">
</video>

This was a group project with two others for COMP6100: Video Games Development.

## My Contributions

My contributions to this project were mainly related to the AI of the enemies that chase and attack the player. Each enemy type extends from the generic `PathFind` class that allows the AI manager to organise and call functions on the enemies without worrying about differing function names.

### Enemy Types

- **Scout** - Small drone-like enemies that do not damage the player, but will wander around a set area until they spot and then chase the player. Once they have spotted the player, they will continue following until the player breaks line-of-sight or is too far away, at which point, they may search the area the player was last seen. When the player is spotted, several "chasers" are spawned underneath the mother tripod that navigate to the player's position.
- **Chaser** - Chasers are fast enemies that deal heavy damage, but are only spawned when "scout" enemies spot the player. If the player manages to escape from the chasers, then the chasers will continue to search the area where the player was last scene for some time, before eventually returning to the mother tripod and de-spawning.
- **Mother** - The Mother is the large tripod alien that walks around the central area of the level. It's AI is different as it does not inherit from the `PathFind` class and instead uses a custom system of manually placed waypoints which is navigates between. It is impractical to use Unity's build-in pathfinding system due to the large size of the Mother.

### PathFind Class

The `PathFind` class uses a finite state machine to keep track and change AI states:

```c#
public enum State
{
    WANDER,
    CHASE,
    RETURN
}
```

This class also provides generic methods that can be used by its children. For example, the `RaycastHitPlayer` function fires a ray-cast from the enemy to the player to check line of sight:

```c#
protected bool RaycastHitPlayer()
{
    LayerMask layers = ~(1 << gameObject.layer);
    RaycastHit hit;

    // transform positions so its not in the ground
    Vector3 raycastPosition = transform.position + (Vector3.up * 1.0f);
    Vector3 playerPosition = player.transform.position + (Vector3.up * 0.0f);

    // only drawn when debug rays are on in unity
    Debug.DrawRay(raycastPosition, playerPosition - raycastPosition, Color.red);

    if (Physics.Raycast(raycastPosition, playerPosition - raycastPosition, out hit, distanceToSeePlayer + 1.0f, layers))
    {
        if (hit.collider.gameObject.tag == "Player")
        {
            return true;
        }
    }

    return false;
}
```

As ray-casts are expensive to perform, when checking if an enemy can see the player, we first check distance and angle which doesn't use physics and relies only on vector operations which is much faster:

```c#
protected bool CanSeePlayer()
{
    Vector2 vec2goal = new Vector2(goal.x, goal.z);
    Vector2 vec2Player = new Vector2(player.transform.position.x, player.transform.position.z);
    Vector2 vec2Us = new Vector2(transform.position.x, transform.position.z);
    Vector2 vec2Forward = new Vector2(transform.forward.x, transform.forward.z);

    Vector2 playerDirection = vec2Player - vec2Us;
    float angle = Vector2.Angle(playerDirection, vec2Forward);
    float distance = Vector2.Distance(vec2Player, vec2Us);

    if (angle < angleToSeePlayer && distance < distanceToSeePlayer)
    {
        // Raycast is expensive, so check angle and distance first.
        if (RaycastHitPlayer())
        {
            return true;
        }
    }

    return false;
}
```

### AI Manager

The AI manager is in charge of coordinating and spawning/deleting the enemies. For example, when the script is first ran, AI manager populates an array of "chaser" enemies before they are needed and each chaser enemy is recycled when destroyed instead of creating a whole new object.

```c#
private void PopulateChaserArray()
{
    for (int i = 0; i < chaserCount; i++)
    {
        GameObject enemy = Instantiate(prefabEnemyChaser, transform);
        enemy.SetActive(false);
        SetAgentSpeed(enemy.transform, chaserBaseSpeed);
        chasers[i] = enemy;
    }
}
```

The AI manager is also used to propagate the player's position from a scout that has seen the player to all the chasers. When a scout sees the player, chasers are spawned, and the `UpdatePlayerLocationInChasers` function is repeatedly called while the scout is still seeing the player. This player location update is done by looping through all AI agents (which are children of the AI manager) and changing their pathfinder goal position and state to tell them to navigate to that position. Once the chaser sees the player for themselves, they will transition into the `CHASE` state instead of the `WANDER` state (used to navigate to a set waypoint.)

```c#
// called when the player has been seen
private void UpdatePlayerLocationInChasers(Vector3 playerPos)
{
    // For each enemy...
    foreach (Transform child in transform)
    {
        // skip if they are not a chaser
        if (!child.CompareTag("EnemyChaser"))
        {
            continue;
        }

        PathFind pathfind = child.GetComponent<PathFind>();

        // set all pathfinding variables to direct to the player
        pathfind.goal = playerPos;
        pathfind.startPos = playerPos;
        pathfind.lastSeenPlayerPos = playerPos;

        // if the chaser is not chasing then it cannot see
        // the player for itself, therefore, we update the state
        // to wander (navigate to goal variable)
        if (pathfind.currentState != PathFind.State.CHASE)
            pathfind.currentState = PathFind.State.WANDER;
        
        // set last seen player timer to 0, i.e, we have seen the
        // player recently (for searching timeout.)
        pathfind.timeSinceLastSeenPlayer = 0.0f;
        pathfind.hasReachedInitialGoal = false;
    }
}
```

## Notes

![](/assets/tripod/Tripod-Cover.png)

[View AI scripts folder on GitHub](https://github.com/daCFniel/Tripod-Attack/tree/main/Assets/Scripts/AI)

[View project on GitHub](https://github.com/daCFniel/Tripod-Attack){:target="_blank"}