'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, Paper, Container, Slider, ThemeProvider, createTheme } from '@mui/material'
import { firestore } from '@/firebase'
import {
	collection,
	doc,
	getDocs,
	query,
	setDoc,
	deleteDoc,
	getDoc,
} from 'firebase/firestore'
import dynamic from 'next/dynamic';

// Dynamically import components that might rely on `window`
const Image = dynamic(() => import('next/image'), { ssr: false });
const theme = createTheme({
	palette: {
		primary: { main: "#197278", bgcolor: "#283D3B" },
		error: { main: "#C44536", dark: "#772E25" }
	}
});


export default function Home() {
	// all the current inventory
	const [inventory, setInventory] = useState([])
	// the inventory with search filters applied 
	const [shownInventory, setShownInventory] = useState([])
	//is the add item modal on?
	const [addItemModal, setAddItemModal] = useState(false)
	// the name of the current item being added
	const [itemName, setItemName] = useState('')
	// values of the add sliders of the items
	const [sliderValues, setSliderValues] = useState([]);
	// is the loading icon being shown?
	const [loading, setLoading] = useState(false);
	//current value of the search bar
	const [searchbar, setSearchbar] = useState("");
	//current filter applied
	const [currentFilter, setCurrentFilter] = useState("");

	//handle the slider
	const handleSliderChange = (name, value) => {
		setSliderValues(prevValues => ({ ...prevValues, [name]: value }));
	};

	// update the local inventory with the one from the database
	const updateInventory = async () => {
		const snapshot = query(collection(firestore, 'inventory'))
		const docs = await getDocs(snapshot)
		const inventoryList = []
		docs.forEach((doc) => {
			inventoryList.push({ name: doc.id, ...doc.data() })
		})
		setInventory(inventoryList)
		setLoading(false);
	}

	useEffect(() => {
		if (typeof window !== 'undefined')
			updateInventory()
	}, []);

	// change the item quantity on the database
	const changeItemQuantity = async (item, amount = 1, action = "add") => {
		setLoading(true);
		const docRef = doc(collection(firestore, 'inventory'), item)
		const docSnap = await getDoc(docRef)
		if (action == "remove") {
			amount *= -1;
		}
		if (docSnap.exists()) {
			const { quantity } = docSnap.data()
			await setDoc(docRef, { quantity: quantity + amount })
		} else {
			await setDoc(docRef, { quantity: amount })
		}
		await updateInventory()
	}

	// add a new item (virtually the same as above)
	const addNewItem = async (item, amount = 1) => {
		if(inventory.length > 100){
			//cap the amount of items
			return;
		}
		setLoading(true);
		item = item.toLowerCase();
		const docRef = doc(collection(firestore, 'inventory'), item)
		const docSnap = await getDoc(docRef)
		if (docSnap.exists()) {
			/// TODO: handle this (alert item exists)
			await setDoc(docRef, { quantity: quantity + amount });
		} else {
			await setDoc(docRef, { quantity: amount })
		}
		await updateInventory()
	}

	// delete an item from the database
	const removeItem = async (item) => {
		setLoading(true);
		item = item.toLowerCase();
		const docRef = doc(collection(firestore, 'inventory'), item);
		await deleteDoc(docRef);
		await updateInventory();
	}

	//search an item (apply filters)
	const searchForItem = (item) => {
		setCurrentFilter(item);
		if(item == "")
			setShownInventory(inventory);
		else
			setShownInventory(inventory.filter((name) => name.name.match(item)));
	}

	const handleOpen = () => setAddItemModal(true)
	const handleClose = () => setAddItemModal(false)

	return (
		<ThemeProvider theme={theme}>
			<Container sx={{ mt: 5 }}>
				<Typography color={"primary.contrastText"} sx={{
					position:"fixed",
					zIndex : 100,
					bgcolor: "error.main"
				}}>
					test build, so please refrain from abusing the database. thank you!!
				</Typography>
				<Modal
					open={addItemModal}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={{ bgcolor: "primary.light", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, boxShadow: 20, flex: 1, flexDirection: "column", p: 5, borderRadius: 2 }}>
						<Typography id="modal-modal-title" variant="h6" component="h2" textAlign={"center"} mb={5}>
							Add a new item!
						</Typography>
						<Stack width="100%" direction={'row'} spacing={2}>
							<TextField
								helperText="The item's name"
								id="outlined-basic"
								label="Item"
								variant="outlined"
								fullWidth
								value={itemName}
								onChange={(e) => setItemName(e.target.value)}
								sx={{
									color: "primary.contrastText"
								}}
							/>
							<Button
								variant="outlined"
								onClick={() => {
									addNewItem(itemName)
									setItemName('')
									handleClose()
								}}
							>
								Add
							</Button>
						</Stack>
					</Box>
				</Modal>
				<Modal open={loading} aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description">
					<Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 64, borderRadius: 32, bgcolor: "black", boxShadow: 20 }}>
						<Image alt="loading gif" width={64} height={64} src="/loading.gif" />
					</Box>
				</Modal>
				<Box sx={{ p: 2 }}>
					<Paper elevation={2} sx={{ bgcolor: "primary.dark" }}>
						<Typography variant={'h2'} sx={{ textAlign: "center", color: "primary.contrastText" }}>
							Your Inventory
						</Typography>
						<Button variant="contained" onClick={handleOpen} sx={{ width: "100%" }}>
							Add a New Item
						</Button>
						<Stack direction={"row"}>
							<TextField
								fullWidth
								alt="item search"
								focused={true}
								sx={{
									hintText: "Search for an item",
									color: "primary.contrastText"
								}}
								onChange={(e) => setSearchbar(e.target.value)}
								value={searchbar}
							/>
							<Button sx={{
								bgcolor: "primary.light",
								color: "primary.contrastText"
							}}
								onClick={() => {
									searchForItem(searchbar);
								}}>
								Search
							</Button>
						</Stack>
						{currentFilter != "" && 
						<Typography sx= {{color: "primary.contrastText"}}>
							Showing results for {currentFilter}
						</Typography>}
					</Paper>
					<Box sx={{ display: "flex", flexDirection: { sm: "column", md: "row" }, flexWrap: "wrap" }}>
						{(currentFilter == "" ? inventory : shownInventory).map(({ name, quantity }) => (
							<Paper
								key={name}
								sx={{ width: { sm: "100", md: 320 }, m: 3 }}>
								<Button sx={{
									position: "relative",
									top: "0px",
									bgcolor: "error.main",
									color: "error.contrastText"
								}} onClick={() => removeItem(name)}>
									Remove item
								</Button>
								<Typography variant={'h3'} sx={{ textAlign: "center", fontWeight: "bold", p: 2 }}>
									{name}
								</Typography>

								<Typography variant={'h5'} textAlign={'center'}>
									Amount: {quantity}
								</Typography>
								<Slider marks max={20} sx={{ mx: 5, width: "80%" }} onChange={(e, v) => { handleSliderChange(name, v) }} value={sliderValues[name] || 0} />
								<Box sx={{ display: "flex", flexDirection: "row" }}>
									<Button variant="contained" onClick={() => changeItemQuantity(name, sliderValues[name])} sx={{ width: "50%" }}>
										Add {sliderValues[name] || 1}
									</Button><Button variant="contained" onClick={() => changeItemQuantity(name, sliderValues[name], "remove")} sx={{ width: "50%" }}>
										Remove {sliderValues[name] || 1}
									</Button>
								</Box>
							</Paper>
						))}
					</Box>
				</Box>
			</Container>
		</ThemeProvider>
	)
}