import React, { useEffect, useState } from 'react'

import { LIB_VERSION } from 'electric-sql/version'
import { makeElectricContext, useLiveQuery } from 'electric-sql/react'
import { genUUID, uniqueTabId } from 'electric-sql/util'
import { ElectricDatabase, electrify } from 'electric-sql/wa-sqlite'
import { Electric, Items as Item, schema } from './generated/client'

import { List, ListItem, ListItemText, Divider, Typography, TextField, Button, Container, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddBoxIcon from '@mui/icons-material/AddBox';

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
    <ElectricProvider db={electric}>
      <ExampleComponent />
    </ElectricProvider>
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

  // todos comes from the live query
  const todos: Item[] = results ?? []
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [editTodo, setEditTodo] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });

  const handleAddTodoChange = (event) => {
    const { name, value } = event.target;
    setNewTodo(prevTodo => ({
      ...prevTodo,
      [name]: value,
    }));
  };

  const handleEditChange = (event) => {
    console.log('event.target', event.target)
    const { name, value } = event.target;
    setEditFormData(prevFormData => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;
    await db.items.create({
      data: {
        id: genUUID(),
        title: newTodo.title,
        description: newTodo.description
      }
    })

    setNewTodo({ title: '', description: '' });
  };

  const handleDeleteTodo = async (id) => {
    await db.items.delete({
      where: {
        id
      }
    })
  };

  const handleEditTodo = (todo) => {
    setEditTodo(todo.id);
    setEditFormData({ title: todo.title, description: todo.description });
  };

  const handleSaveEditTodo = async (id) => {
    await db.items.update({
      where: {
        id
      },
      data: {
        title: editFormData.title,
        description: editFormData.description
      }
    })
    setEditTodo(null);
  };

  return (
    <Container>
      <Typography variant="h6" sx={{ marginTop: 2 }}>Todo List</Typography>
      <div>
        <TextField label="Title" name="title" variant="outlined" size="small" value={newTodo.title || ""} onChange={handleAddTodoChange} />
        <TextField label="Description" name="description" variant="outlined" size="small" value={newTodo.description || ""} onChange={handleAddTodoChange} />
        <Button startIcon={<AddBoxIcon />} onClick={handleAddTodo}>Add Todo</Button>
      </div>
      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        {todos.map((todo) => (
          <React.Fragment key={todo.id}>
            {editTodo === todo.id ? (
              <ListItem id={todo.id}>
                <TextField label="Title" name="title" variant="outlined" size="small" value={editFormData.title || ""} onChange={handleEditChange} />
                <TextField label="Description" name="description" variant="outlined" size="small" value={editFormData.description || ""} onChange={handleEditChange} />
                <Button onClick={() => handleSaveEditTodo(todo.id)}>Save</Button>
              </ListItem>
            ) : (
              <ListItem id={todo.id}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleEditTodo(todo)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteTodo(todo.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }>
                <ListItemText primary={todo.title} secondary={todo.description} />
              </ListItem>
            )}
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
}

export default Example;