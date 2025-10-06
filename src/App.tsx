<Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="manager">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="manager">
                <Dashboard />
              </ProtectedRoute>
            } />