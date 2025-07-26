import React, { useState } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useApp } from '../contexts/AppContext'
import SearchForm from './SearchForm'
import SearchResults from './SearchResults'
import DownloadQueue from './DownloadQueue'
import LoginDialog from './LoginDialog'
import Header from './Header'
import Sidebar from './Sidebar'

const MainDownloader = () => {
  const { isAuthenticated } = useApi()
  const { ui, searchResults, downloads } = useApp()
  const [currentTab, setCurrentTab] = useState('search')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
        
        <main className="flex-1 p-6">
          {currentTab === 'search' && (
            <div className="space-y-6">
              <SearchForm />
              {searchResults.length > 0 && <SearchResults />}
            </div>
          )}
          
          {currentTab === 'downloads' && (
            <DownloadQueue downloads={downloads} />
          )}
          
          {currentTab === 'history' && (
            <div className="text-center text-gray-500 py-12">
              <h3 className="text-lg font-medium">Download History</h3>
              <p>Your download history will appear here.</p>
            </div>
          )}
        </main>
      </div>

      {ui.showLoginDialog && <LoginDialog />}
    </div>
  )
}

export default MainDownloader