import { Button, Icon, Layout } from "@stellar/design-system"
import { Routes, Route, Outlet, NavLink } from "react-router-dom"
import styles from "./App.module.css"
import ConnectAccount from "./components/ConnectAccount"
import { labPrefix } from "./contracts/util"
import AdminDashboard from "./pages/AdminDashboard"
import Catalog from "./pages/Catalog"
import Debug from "./pages/Debug"
import Home from "./pages/Home"
import MyLibrary from "./pages/MyLibrary"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/catalog" element={<Catalog />} />
				<Route path="/my-library" element={<MyLibrary />} />
				<Route path="/admin" element={<AdminDashboard />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
			</Route>
		</Routes>
	)
}

const AppLayout: React.FC = () => (
	<div className={styles.AppLayout}>
		<Layout.Header
			projectId="stellar-library"
			projectTitle="Stellar Library"
			hasThemeSwitch={true}
			contentCenter={
				<>
					<NavLink to="/catalog">
						{({ isActive }) => (
							<Button variant="tertiary" size="md" disabled={isActive}>
								<Icon.BookOpen01 size="md" />
								Catalog
							</Button>
						)}
					</NavLink>
					<NavLink to="/my-library">
						{({ isActive }) => (
							<Button variant="tertiary" size="md" disabled={isActive}>
								<Icon.File06 size="md" />
								My Library
							</Button>
						)}
					</NavLink>
					<NavLink to="/admin">
						{({ isActive }) => (
							<Button variant="tertiary" size="md" disabled={isActive}>
								<Icon.Settings01 size="md" />
								Admin
							</Button>
						)}
					</NavLink>
				</>
			}
			contentRight={<ConnectAccount />}
		/>

		<main>
			<Layout.Content>
				<Layout.Inset>
					<Outlet />
				</Layout.Inset>
			</Layout.Content>
		</main>

		<Layout.Footer>
			<nav>
				<NavLink to="/debug" className="Link Link--secondary">
					<Icon.Code02 size="sm" /> Contract Explorer
				</NavLink>
				<a href={labPrefix()} className="Link Link--secondary" target="_blank">
					<Icon.SearchMd size="sm" /> Transaction Explorer
				</a>
			</nav>
		</Layout.Footer>
	</div>
)

export default App
