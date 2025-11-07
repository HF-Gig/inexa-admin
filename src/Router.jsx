import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import App from "./App";
import {
  Users,
  Courses,
  Dashboard,
  Signin,
  CourseForm,
  Staff,
  StaffForm,
  ManageCourses,
  Management,
} from "./scenes";
import PrivateRoute from "./components/PrivateRoute";
import Organization from "./scenes/organization";
import OrganizationForm from "./scenes/organization/OrganizationForm";
import Featured from "./scenes/featured";
import Contact from "./scenes/contact";
import InexaStaff from "./scenes/inexa_facilitators";
import InexaFacilitatorForm from "./scenes/inexa_facilitators/InexaFacilitatorForm";
import Providers from "./scenes/providers";
import ProviderForm from "./scenes/providers/ProviderForm";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<App />}>
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <PrivateRoute>
                <Courses />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:type/:id?"
            element={
              <PrivateRoute>
                <CourseFormWrapper />
              </PrivateRoute>
            }
          />
          <Route
            path="/inexa-staff"
            element={
              <PrivateRoute>
                <InexaStaff />
              </PrivateRoute>
            }
          />
          <Route
            path="/inexa-staff/add"
            element={
              <PrivateRoute>
                <InexaFacilitatorForm mode="add" />
              </PrivateRoute>
            }
          />
          <Route
            path="/inexa-staff/edit/:id"
            element={
              <PrivateRoute>
                <InexaFacilitatorForm mode="edit" />
              </PrivateRoute>
            }
          />
          <Route
            path="/inexa-staff/view/:id"
            element={
              <PrivateRoute>
                <InexaFacilitatorForm mode="view" />
              </PrivateRoute>
            }
          />
          <Route
            path="/programs"
            element={
              <PrivateRoute>
                <Courses pageType={"programs"} />
              </PrivateRoute>
            }
          />
          <Route
            path="/programs/:type/:id?"
            element={
              <PrivateRoute>
                <CourseFormWrapper page={"program"} />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <PrivateRoute>
                <Staff />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/add"
            element={
              <PrivateRoute>
                <StaffForm mode="add" />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/edit/:id"
            element={
              <PrivateRoute>
                <StaffForm mode="edit" />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/view/:id"
            element={
              <PrivateRoute>
                <StaffForm mode="view" />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/:id/manage-courses"
            element={
              <PrivateRoute>
                <ManageCourses />
              </PrivateRoute>
            }
          />
          <Route
            path="/organization"
            element={
              <PrivateRoute>
                <Organization />
              </PrivateRoute>
            }
          />
          <Route
            path="/organization/add"
            element={
              <PrivateRoute>
                <OrganizationForm mode="add" />
              </PrivateRoute>
            }
          />
          <Route
            path="/organization/edit/:id"
            element={
              <PrivateRoute>
                <OrganizationForm mode="edit" />
              </PrivateRoute>
            }
          />
          <Route
            path="/organization/view/:id"
            element={
              <PrivateRoute>
                <OrganizationForm mode="view" />
              </PrivateRoute>
            }
          />
          <Route
            path="/management"
            element={
              <PrivateRoute>
                <Management />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/featured"
            element={
              <PrivateRoute>
                <Featured />
              </PrivateRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <PrivateRoute>
                <Contact />
              </PrivateRoute>
            }
          />
          <Route
            path="/providers"
            element={
              <PrivateRoute>
                <Providers />
              </PrivateRoute>
            }
          />
          <Route
            path="/providers/add"
            element={
              <PrivateRoute>
                <ProviderForm mode="add" />
              </PrivateRoute>
            }
          />
          <Route
            path="/providers/edit/:id"
            element={
              <PrivateRoute>
                <ProviderForm mode="edit" />
              </PrivateRoute>
            }
          />
          <Route
            path="/providers/view/:id"
            element={
              <PrivateRoute>
                <ProviderForm mode="view" />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

function CourseFormWrapper({page = "course"}) {
  const { type } = useParams();
  let mode = "add";
  if (type === "edit") mode = "edit";
  else if (type === "view") mode = "view";
  return <CourseForm mode={mode} page={page} />;
}

export default AppRouter;
