from prisma import Prisma

# One Prisma client per process (web or worker), reused across requests/jobs.
# FastAPI wires connect/disconnect to app lifespan; the worker does the same
# around its polling loop. Never instantiate Prisma() anywhere else.
db = Prisma(auto_register=True)


async def connect_db() -> None:
    if not db.is_connected():
        await db.connect()


async def disconnect_db() -> None:
    if db.is_connected():
        await db.disconnect()
