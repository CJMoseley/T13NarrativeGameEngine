# Ships, Components, and Controls

Ships are 3D models with explorable interiors. They can be purchased or rebuilt from scrap or purchased components. Essential systems include: Generator, Flight, Vortex Generators, Shield Generators, Weapons, Computers, Life-support, and Repair bays.

## Components

### Fuels
*   **Sugars/Proteins/Amino-acids:** For crew and biological generators
*   **Long-chains:** Petrochemicals (primitive).
*   **Methane:** Easily scooped gas.
*   **Fissile Matter:** Uranium, Plutonium, Thorium (dangerous, requires heavy shielding).
*   **Fusion Matter:** From gas giants/suns (popular).
*   **Darkmatter:** Advanced, heavy, requires specific scoops.
*   **Zero-point energy:** Extracted from quantum foam (restricted).
*   **Protomatter:** Extracted from the early universe via wormhole (very powerful, dangerous).

### Power Plants
*   **Chemical:** Burns fuel/oxygen.
*   **Fission:** Uses fissile matter.
*   **Fusion:** Fuses matter for electricity or plasma.
*   **Anti-matter annihilator:** Destroys matter for plasma.
*   **Mass-accelerator / Quantum singularity:** Consumes matter for plasma.
*   **Plasma converter:** Converts plasma to electricity.

### Shield Generators
*   **Magnetic Shield** The original forcefield, can cling to a wall based on the frequency that it resonates at.
*   **Warp Field Shield** Distorts spacetime allowing FTL in system and "slowly" between systems. Allows space racing and combat (of a sort).
*   **Tractive Shield** The rolling forcefield that can move the ship by applying force through the shield onto another surface. Gains additional torque and rotation speed when in resonance with the wall frequency and "section" frequency/key.
*   **Slide / Jump Shield** The sliding forcefield is "smoother" than the rolling field, being both flatter due to the vertical compression, but also having a lower friction. This shield does not attract the wall, but slightly repells it. The exact tuning reflects how "frictionless" it can be. Releasing a sliding forcefield while keeping the sliding effect turns it into an effective jump force, or with a jump cancel action you can snap back to rolling and get a speed boost instead, but you need this shield model to do it. All wormhole racers are required to have this level of sheild in leagues. 

*Note: Wiring and conduits have different frequencies per metre.*

### Weapons
Weapons are typically turret mounted, or centreline, fired by a pilot, autotargetting or a gunner. Weapons that are allowed vary by league and local technology levels a lot, as well as just whether races are armed or not. these are not a definitive list, additional material may be found in T13.
* **Ballistics:** Basic bullets, often chemical propelled for convenience, requires ammo and is often negated by shields.
* **Hyperballistics:** Faster bullets, electrically or gravitationally propelled, still requires ammo, but has a bigger punch and reach.
* **Laser Beams:** Everyones favourites, don't work too well in the wormhole, where gravity effects often bend light and the shot. Power output is limited by frequency, and frequency of beams impast the wormhole directly creating resonance. Should be fun.
* **Plasma Catapults:** Spits fast plasma packets, good for all purposes, overloads shields, melts armour, cooks flesh, and can harmonically track the wormhole if correctly tuned.
* **Dark Matter Cannons:** They old Gravity Gun, can really mess with the race track and wormhole stability, handle with care.
* **Matter Disrupters:** Reach through shields and unmake physical matter explosively with antimatter protons held in a Laser confinement beam
* **Missile Launchers:** Explosive warheads with guidance systems and gravity compensators usually to avoid the worst effects of flying in the wormhole.
* **Slide Mines:** Combines misile tech and plasma catapult tech to slide plasma explosive across the wormhole surface.
* **Spike Shields:** Shields designed to be spikey and attack and puncture other ships shields, they can also do the ben hur chariot thing to nearby shields, ruining their integrity, postentially collapsing them.

## Control Schemes
(User defined, defaults below)

Default camera stuff: There should be a internal cockpit view, that can be used during races. External view should be directly behind the ship, and angled so the ship is always slightly below the camera, no matter what orientation the ship takes, The camera can move around the ship slightly (15 degrees or so in each direction) so that camera steering is part of the race experience (hard turns will be assisted by moving the camera and orienting the ship at the same time as controlling the rolling direction with WASD)

Shield rolling can only accelerate the ship when the shield is in contact with a surface (planet, wormhole wall, another shield, hyperspace plain, another ship (particularly large freighters, warships and spaceliners))

The noise of the ship shield in contact with the wall should make two sinewaves, one the ship engine tuning and the other the key of the wall there, this lets everyone hear when they are out of harmony withthe wall of the tunnel there (see wormhole songs).

*   **WASD / Left Joystick:** Move player / Rotate spherical shield. All should be relative to the ship look direction, not the wormhole tunnel.
*   **Mouse / Right Joystick:** Look direction / Ship attitude / Camera. Ship roll/yaw are probably linked.
*   **Mouse Click / Right Trigger:** Shoot.
*   **Mouse Wheel / Bumpers:** Scroll weapon.
*   **Right Click / Left Trigger:** Thrusters (assist jumps/flight).
*   **Spacebar / Bottom Button:** Shield compression (Slide mode). Release to Jump. Jump cancel for speed boost.
*   **E / Top Button:** Inventory.
*   **Q / Left Button:** Scoop (activates scoop and magnetic tractor).
*   **Shift / Right Button:** Retune engine (changes key based on movement relative to the section's "true" chord).