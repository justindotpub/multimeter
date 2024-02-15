import React, { useEffect, useState } from 'react'

import { LIB_VERSION } from 'electric-sql/version'
import { makeElectricContext, useLiveQuery } from 'electric-sql/react'
import { genUUID, uniqueTabId } from 'electric-sql/util'
import { ElectricDatabase, electrify } from 'electric-sql/wa-sqlite'
import { Electric, Items as Item, schema } from './generated/client'

const { ElectricProvider, useElectric } = makeElectricContext<Electric>()

function Example() {
  const [electric, setElectric] = useState<Electric>()

  useEffect(() => {
    let isMounted = true
      
    // Must be an async function to use await
    const init = async () => {
      const config = {
        auth: {
          // Hard coded this from the docs
          token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoiMSIsImlhdCI6MTY4NDg3ODEwM30.'
        },
        debug: true,
        url: 'http://localhost:5133'
      }
      
      // Unique database name for each tab.
      const { tabId } = uniqueTabId()
      const scopedDbName = `basic-${LIB_VERSION}-${tabId}.db`

      // Make sure wa-sqlite files are copied to priv/static/wasm and Multimeter.Endpoint is configured to serve that folder.
      const conn = await ElectricDatabase.init(scopedDbName, '/wasm/')
      const electric = await electrify(conn, schema, config)

      if (!isMounted) {
        return
      }

      setElectric(electric)
    }

    init()
     
    return () => {
      isMounted = false
    }
  }, [])

  if (electric === undefined) {
    console.log('Electric is undefined')
    return null
  }

  return (
    <>
      <h2>We are connected</h2>
    <ElectricProvider db={electric}>
      <ExampleComponent />
      </ElectricProvider>
    </>
  )
}

const ExampleComponent = () => {
  const { db } = useElectric()!

  const { results } = useLiveQuery(
    db.items.liveMany()
  )

  useEffect(() => {
    const syncItems = async () => {
      // Resolves when the shape subscription has been established.
      const shape = await db.items.sync()

      // Resolves when the data has been synced into the local database.
      await shape.synced
    }

    syncItems()
  }, [])

  const addItem = async () => {
    await db.items.create({
      data: {
        id: genUUID(),
      }
    })
  }

  const clearItems = async () => {
    await db.items.deleteMany()
  }

  const items: Item[] = results ?? []

  return (
    <div>
      <h2>Items</h2>
      <div className="controls">
        <button className="button" onClick={ addItem }>
          Add
        </button>
        <button className="button" onClick={ clearItems }>
          Clear
        </button>
      </div>
      {items.map((item: Item, index: number) => (
        <p key={ index } className="item">
          <code>{ item.title }</code>
        </p>
      ))}
    </div>
  )
}

export default Example;