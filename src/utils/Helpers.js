/*
POSITIONS CAMERA COURANTES :
                  
Vue de dessus (TOP)     Vue de face (FRONT)    Vue de côté (SIDE)
   z                        y                       y
   ↑                        ↑                       ↑
   |                        |                       |  
   |                        |                       |
   +---→ x              +---→ x                z ←--+
   
cam(0,10,0)            cam(0,0,10)            cam(10,0,0)


ROTATIONS (en radians):

         π/2
          ↑ 
          |
   π ←----+---→ 0
          |
         -π/2

          y   
    π/2    |    -π/2
     \     |     /
      \    |    /
  π ---+---+---+--- 0
       \   |   /
        \  |  /
    -3π/2  ↓   3π/2
         -π

DISTANCES & SCALE:

Petit →  Grand
1    →   10
|---------|
0.1  1   10   100
^    ^    ^    ^
min  human big  max


FIELD OF VIEW (FOV):
   
   45°     60°      90°     
  /|      /|       /|
 / |     / |      / |
/  |    /  |     /  |
/____|  /____|   /____|

45° = zoom
60° = human eye
90° = wide
*/

/*
CAMERA POSITIONS & ROTATIONS COMPLETE:
             TOP                           PERSPECTIVE
           y                                    y
     [-1,1]|[0,1][1,1]                         ↑ 
           |                                    |   ↗z
  [-1,0] --+-- [1,0]                           | ↗  
           |                     [-1,1,1] ------ [1,1,1]
     [-1,-1]|[0,-1][1,-1]              |      /|
                                       |    /  |
                                       |  /    |
                            [-1,-1,1]  |/      |
                                      /--------[1,-1,1]
                                   [-1,-1,-1]

LIGHTS POSITION & SHADOWS:
           Light
             ↓       Shadow gets:
        \   |   /    - Bigger
         \  |  /     - Softer
   Object → ⬤        - Lighter
         /  |  \      
        /   |   \     As distance ↑
      Shadow grows

STANDARD CAMERA VIEWS:
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
TOP (0,10,0)        FRONT (0,0,10)      RIGHT (10,0,0)      ISO (10,10,10)
    ↓                    ↓                   ↓                   ↙
 ┌─────┐              ┌─────┐             ┌─────┐            ┌─────┐
 │     │              │     │             │     │            │   ↙ │
 │  ⬤  │              │  ⬤  │             │  ⬤  │            │ ↙   │
 │     │              │     │             │     │            │     │
 └─────┘              └─────┘             └─────┘            └─────┘

FOV & FRUSTUM:
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
near
│-_  60° FOV    90° FOV        Frustum
│  -_   /-\       /─\          Culling:
│    -_ │ │     /   \   far    ────────
│      -│ │   /       \  │     Only renders
└────── │ │ /           \ │     what's inside
   clip │ │              \│     viewing volume
  plane │ │               │
*/
